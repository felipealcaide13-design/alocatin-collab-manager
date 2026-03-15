import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExpandableCardProps {
  title: string;
  preview: React.ReactNode;
  full: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ExpandableCard({ title, preview, full, defaultExpanded = false }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 min-h-0">
        {expanded ? full : preview}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? "Ver menos" : "Ver mais"}
        </Button>
      </CardFooter>
    </Card>
  );
}
