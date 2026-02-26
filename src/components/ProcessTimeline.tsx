const STEPS = [
  {
    title: "Choose your model",
    description:
      "Choose between our 20' and 40' high-cube shells. Both come fully insulated with locking vestibules and off-grid prewiring.",
  },
  {
    title: "Build + spec confirmation",
    description:
      "Our fabrication team cuts openings, builds interior framing, and installs insulation. We ship a final spec package covering finishes and appliances for your approval before locking in production.",
  },
  {
    title: "Delivery + set",
    description:
      "We work with you to determine the best options for loading and delivery—tilt bed trailer or crane service to deliver to site and set on your foundation (piers, helical piles, or slab). Final hookups for power, water, and waste are your responsibility. Waste consultations are available.",
  },
];

export function ProcessTimeline() {
  return (
    <ol className="relative grid gap-10 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-surface-muted/80 md:before:left-6">
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative flex gap-6 pl-12 md:pl-16">
          <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white md:left-1">
            {index + 1}
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-foreground/75">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
