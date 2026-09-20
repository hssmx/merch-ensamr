import Link from 'next/link';

const steps = [
  { label: 'Your bag', href: '/cart' },
  { label: 'Your details', href: '/checkout' },
  { label: 'Track order', href: '/account' },
];

export function CommerceSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <nav className="commerce-steps" aria-label="Order progress">
      {steps.map((step, index) => (
        <div
          className={
            index === current ? 'is-current' : index < current ? 'is-done' : ''
          }
          key={step.label}
        >
          <span className="commerce-step-number">0{index + 1}</span>
          {index < current ? (
            <Link href={step.href}>{step.label}</Link>
          ) : (
            <span aria-current={index === current ? 'step' : undefined}>
              {step.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
