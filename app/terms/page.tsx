import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — LogScale",
  description:
    "The terms and conditions for using the LogScale feedback platform.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of terms",
    body: (
      <p>
        By creating an account or using LogScale, you agree to these Terms of
        Service. If you are using the service on behalf of an organization, you
        represent that you have authority to bind that organization to these
        terms.
      </p>
    ),
  },
  {
    heading: "Your account",
    body: (
      <p>
        You are responsible for safeguarding access to your account and for all
        activity that happens under it. You must provide accurate information
        and promptly notify us of any unauthorized use.
      </p>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to use LogScale to:</p>
        <ul>
          <li>Violate any law or infringe anyone&apos;s rights.</li>
          <li>
            Upload malicious code, spam, or content that is unlawful, hateful,
            or harassing.
          </li>
          <li>
            Attempt to disrupt, reverse-engineer, or gain unauthorized access to
            the service or its infrastructure.
          </li>
          <li>Abuse the anonymous voting system or manipulate results.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Your content",
    body: (
      <p>
        You retain ownership of the content you and your users submit. You grant
        us a limited license to host, store, and display that content solely to
        operate and provide the service. You are responsible for ensuring you
        have the rights to the content you publish.
      </p>
    ),
  },
  {
    heading: "Plans, billing & cancellation",
    body: (
      <>
        <p>
          LogScale offers a free <strong>Hobby</strong> plan and a paid{" "}
          <strong>Startup</strong> plan. Paid subscriptions are billed in
          advance on a recurring basis through our payment provider, Stripe.
        </p>
        <p>
          You can cancel at any time from your billing settings; your plan
          remains active until the end of the current billing period. Fees are
          non-refundable except where required by law.
        </p>
      </>
    ),
  },
  {
    heading: "Service availability",
    body: (
      <p>
        We work hard to keep LogScale fast and reliable, but the service is
        provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
        We do not guarantee uninterrupted or error-free operation and may
        perform maintenance that temporarily affects availability.
      </p>
    ),
  },
  {
    heading: "Termination",
    body: (
      <p>
        You may stop using the service and delete your workspace at any time. We
        may suspend or terminate access if you violate these terms or use the
        service in a way that could harm us, other users, or third parties.
      </p>
    ),
  },
  {
    heading: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, LogScale and its team will not
        be liable for any indirect, incidental, or consequential damages, or for
        any loss of data, revenue, or profits arising from your use of the
        service.
      </p>
    ),
  },
  {
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. When we make material
        changes, we will update the &ldquo;last updated&rdquo; date above.
        Continued use of the service after changes take effect constitutes
        acceptance of the revised terms.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        Questions about these terms? Get in touch, or read our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 13, 2026"
      intro={
        <p>
          These Terms of Service govern your use of LogScale. Please read them
          carefully — by using the platform you agree to be bound by them. We
          aim to keep them clear and fair for the startups and indie developers
          we build for.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
