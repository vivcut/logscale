import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Pittstop",
  description:
    "How Pittstop collects, uses, and protects your data and the data your users submit.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Information we collect",
    body: (
      <>
        <p>
          We collect the minimum information needed to run the service:
        </p>
        <ul>
          <li>
            <strong>Account data</strong> — your email address and, if you sign
            in with Google, your basic profile (name and avatar).
          </li>
          <li>
            <strong>Workspace content</strong> — the boards, posts, roadmap
            items, changelog entries, surveys, and status pages you create.
          </li>
          <li>
            <strong>End-user feedback</strong> — votes, comments, and survey
            responses submitted by your users, including an anonymous
            device fingerprint used purely to prevent duplicate voting.
          </li>
          <li>
            <strong>Usage &amp; technical data</strong> — basic logs, IP
            address, and browser information for security and reliability.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "How we use your information",
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Pittstop platform.</li>
          <li>Authenticate you and keep your workspace secure.</li>
          <li>Process subscription payments through our payment provider.</li>
          <li>Prevent abuse, spam, and duplicate voting.</li>
          <li>Communicate important service and account updates.</li>
        </ul>
        <p>
          We do not sell your personal data, and we never sell the feedback
          data your users submit.
        </p>
      </>
    ),
  },
  {
    heading: "Anonymous voting & fingerprinting",
    body: (
      <p>
        To keep public boards open without forcing your users to create
        accounts, we generate a privacy-preserving device fingerprint. It is
        used solely to deduplicate votes and is never used to track individuals
        across other websites or to build advertising profiles.
      </p>
    ),
  },
  {
    heading: "Third-party services",
    body: (
      <>
        <p>
          We rely on a small set of trusted subprocessors to operate the
          service:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — authentication, database, and file
            storage.
          </li>
          <li>
            <strong>Stripe</strong> — subscription billing and payment
            processing. We never store full card details on our servers.
          </li>
          <li>
            <strong>Cloudflare</strong> — hosting, delivery, and security.
          </li>
        </ul>
        <p>
          Each subprocessor only receives the data necessary to perform its
          function.
        </p>
      </>
    ),
  },
  {
    heading: "Cookies",
    body: (
      <p>
        We use essential cookies and local storage to keep you signed in and to
        remember preferences such as your theme. We do not use third-party
        advertising cookies.
      </p>
    ),
  },
  {
    heading: "Data retention",
    body: (
      <p>
        We retain your data for as long as your account is active. When you
        delete content or close your workspace, we remove the associated data
        within a reasonable period, except where we are required to retain it
        for legal or accounting purposes.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        Depending on where you live, you may have the right to access, correct,
        export, or delete your personal data. You can manage most of your data
        directly from your dashboard, or contact us to exercise any of these
        rights.
      </p>
    ),
  },
  {
    heading: "Security",
    body: (
      <p>
        We protect your data with encryption in transit, scoped access
        controls, and row-level security policies. No method of transmission or
        storage is perfectly secure, but we work hard to safeguard your
        information.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we make
        material changes, we will update the &ldquo;last updated&rdquo; date
        above and, where appropriate, notify you.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        Questions about privacy? Reach out any time, or review our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 13, 2026"
      intro={
        <p>
          This Privacy Policy explains how Pittstop (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;) collects, uses, and protects information when you
          use our feedback platform — both as a customer running a workspace and
          as an end user submitting feedback. We keep things minimal: we only
          collect what we need to run the product.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
