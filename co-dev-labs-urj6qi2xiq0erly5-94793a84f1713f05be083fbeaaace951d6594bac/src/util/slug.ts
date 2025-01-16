export function generateSlug(username: string): string {
  // Remove special characters and replace spaces with dashes
  let slug = username
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return slug;
}

export async function generateUniqueSlug(
  username: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let baseSlug = generateSlug(username);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}