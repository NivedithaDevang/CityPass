export function createEventSlug(title?: string): string {
  return (title || "event")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}


export function createOrganiserRequestSlug(title?: string): string {
  return (title || "organiser-requests")
    .toLowerCase()
    .trim()

}