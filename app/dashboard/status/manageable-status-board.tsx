"use client";

import { StatusBoard, type StatusSite } from "@/components/status-board";
import { DeleteSiteButton } from "./delete-site-button";
import { IncidentForm } from "./incident-form";

/**
 * Client wrapper around the shared StatusBoard. The per-row delete control and
 * "post incident update" form are supplied here (on the client) so we never
 * pass a function across the Server→Client component boundary, which Next.js
 * forbids.
 */
export function ManageableStatusBoard({
  sites,
  canManage,
}: {
  sites: StatusSite[];
  canManage: boolean;
}) {
  return (
    <StatusBoard
      sites={sites}
      actionSlot={
        canManage ? (site) => <DeleteSiteButton id={site.id} /> : undefined
      }
      incidentSlot={
        canManage ? (site) => <IncidentForm siteId={site.id} /> : undefined
      }
    />
  );
}

