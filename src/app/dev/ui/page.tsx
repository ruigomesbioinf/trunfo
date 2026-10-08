"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function KitchenSink() {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }

  const colors = [
    ["background", "bg-background"],
    ["surface", "bg-surface"],
    ["surface-raised", "bg-surface-raised"],
    ["border", "bg-border"],
    ["border-strong", "bg-border-strong"],
    ["foreground", "bg-foreground"],
    ["muted", "bg-muted"],
    ["accent", "bg-accent"],
    ["accent-foreground", "bg-accent-foreground"],
    ["success", "bg-success"],
    ["danger", "bg-danger"],
    ["focus", "bg-focus"],
  ];

  return (
    <main id="main-content" className="mx-auto max-w-4xl p-6">
      <h1>Kitchen Sink</h1>

      <section className="mt-6">
        <Card padding="lg">
          <h2>Colours</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {colors.map(([name, className]) => (
              <div
                key={name}
                className="flex items-center gap-3"
              >
                <span
                  className={`size-8 rounded-md border border-border ${className}`}
                />
                <span className="text-sm text-muted">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <Card padding="lg">
          <h2>Buttons</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button>Play now</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="lg">Play now</Button>
            <Button variant="secondary" size="lg">
              Secondary
            </Button>
            <Button variant="ghost" size="lg">
              Ghost
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button isLoading>Loading</Button>
            <Button variant="secondary" isLoading>
              Loading
            </Button>
            <Button variant="ghost" isLoading>
              Loading
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card padding="lg">
          <h2>Button Links</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/">Primary</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Secondary
            </ButtonLink>
            <ButtonLink href="/" variant="ghost">
              Ghost
            </ButtonLink>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card padding="lg">
          <h2>Cards</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card padding="md">
              <p>Card with medium padding.</p>
            </Card>

            <Card padding="lg">
              <p>Card with large padding.</p>
            </Card>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card padding="lg">
          <h2>Inputs</h2>

          <div className="mt-6 space-y-6">
            <Input label="Nome" />

            <Input
              label="Nome"
              hint="Como te devemos chamar?"
            />

            <Input
              label="Nome"
              required
              hint="Como te devemos chamar?"
            />

            <Input
              label="Nome"
              required
              hint="Como te devemos chamar?"
              error="Escreve um nome válido"
              defaultValue="123"
            />

            <Input
              label="Nome"
              disabled
              defaultValue="Rui"
            />
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card padding="lg">
          <h2>Interactive Loading</h2>

          <div className="mt-4">
            <Button
              isLoading={loading}
              onClick={handleClick}
            >
              Play now
            </Button>
          </div>
        </Card>
      </section>

    </main>
  );
}
