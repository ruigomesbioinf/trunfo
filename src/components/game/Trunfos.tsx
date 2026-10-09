import clsx from "clsx";
import { Card } from "@/components/ui/Card";

type TrunfosProps = {
  count: number;
  total: number;
};

export function Trunfos({ count, total }: TrunfosProps) {
  return (
    <aside aria-labelledby="trunfos-title">
      <Card padding="md">
        <h2 id="trunfos-title" className="text-lg">
          Trunfos
        </h2>

        <p className="mt-1 text-sm text-muted">
          {count} de {total}
        </p>

        <div aria-hidden="true" className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={clsx(
                "size-6 rounded-md border transition-colors duration-200",
                index < count
                  ? "border-accent bg-accent"
                  : "border-border-strong",
              )}
            />
          ))}
        </div>
      </Card>
    </aside>
  );
}
