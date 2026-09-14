"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: any) => {
  const Group =
    (ResizablePrimitive as any).PanelGroup ||
    (ResizablePrimitive as any).default?.PanelGroup ||
    React.Fragment;
  if (Group === React.Fragment)
    return (
      <div
        className={cn(
          "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
          className,
        )}
        {...props}
      />
    );
  return (
    <Group
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
};

const ResizablePanel =
  (ResizablePrimitive as any).Panel ||
  (ResizablePrimitive as any).default?.Panel ||
  (({ children }: any) => (
    <div className="flex-1 overflow-hidden">{children}</div>
  ));

const ResizableHandle = ({ withHandle, className, ...props }: any) => {
  const Handle =
    (ResizablePrimitive as any).PanelResizeHandle ||
    (ResizablePrimitive as any).default?.PanelResizeHandle ||
    (({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ));
  return (
    <Handle
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Handle>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
