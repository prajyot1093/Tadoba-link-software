import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface UseWebSocketProps {
  isAuthenticated: boolean;
}

export function useWebSocket({ isAuthenticated }: UseWebSocketProps) {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    // Only connect if we should reconnect (user is still authenticated)
    if (!shouldReconnectRef.current) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected for real-time alerts");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'alert') {
            const alert = message.data;
            
            // Show toast notification
            toast({
              title: `⚠️ Wildlife Alert: ${alert.animalName}`,
              description: alert.message,
              variant: "destructive",
              duration: 10000,
            });

            // Play alert sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaJ0fHThTMGH2ex6+2nVhQJR6Dh8bllHAU2idDx04UzBh9nservp1YUCUef4fG4ZRwFNonQ8dOFMwYfZ7Lr7adWFAlHn+HxuGUcBTaJ0PHTdTwJMHau5eetXhcMUJ/g8bllHAU3jtDx04Y0Bx5osvDupVgVC0mf4PG5ZhwFOI3Q8dOGNAce');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore if autoplay is blocked
            });

            // Invalidate alert queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["/api/alerts/my"] });
            queryClient.invalidateQueries({ queryKey: ["/api/alerts/recent"] });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        
        // Only auto-reconnect if we should (user still authenticated, component still mounted)
        if (shouldReconnectRef.current) {
          console.log("Reconnecting in 5s...");
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }, [toast]);

  useEffect(() => {
    // Reset reconnection flag based on auth state
    shouldReconnectRef.current = isAuthenticated;
    
    // Only connect if authenticated
    if (!isAuthenticated) {
      // Clean up existing connection if user logs out
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }
    
    connect();

    return () => {
      // Disable reconnection when component unmounts
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, isAuthenticated]);

  return wsRef.current;
}
