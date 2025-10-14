import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, FileSearch, RefreshCw, Plus } from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          {icon || <FileSearch className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {description}
        </p>
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )
        )}
      </CardContent>
    </Card>
  );
}

export function NoCamerasState() {
  return (
    <EmptyState
      icon={<Camera className="h-8 w-8 text-muted-foreground" />}
      title="No Cameras Found"
      description="Get started by adding your first surveillance camera to the system. You can add cameras manually or generate demo data for testing."
      action={{
        label: "Add Camera",
        href: "/surveillance"
      }}
    />
  );
}

export function NoDetectionsState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<FileSearch className="h-8 w-8 text-muted-foreground" />}
      title="No Detections Yet"
      description="No threats or objects have been detected yet. Upload images to cameras or generate demo data to see detection analytics."
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh
      } : undefined}
    />
  );
}

export function NoDataState({ title, description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={<FileSearch className="h-8 w-8 text-muted-foreground" />}
      title={title || "No Data Available"}
      description={description || "There is no data to display at this time. Try adjusting your filters or check back later."}
    />
  );
}
