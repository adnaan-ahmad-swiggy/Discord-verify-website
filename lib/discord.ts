const DISCORD_API = 'https://discord.com/api/v10';

export async function assignRole(discordId: string, roleId: string): Promise<void> {
  const guildId = process.env.GUILD_ID!;
  const botToken = process.env.DISCORD_TOKEN!;

  const url = `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`;
  console.log(`Assigning role ${roleId} to user ${discordId} in guild ${guildId}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    console.error(`Discord API error (${response.status}):`, error);
    throw new Error(`Failed to assign role (${response.status}): ${error}`);
  }
}

export async function removeRole(discordId: string, roleId: string): Promise<void> {
  const guildId = process.env.GUILD_ID!;
  const botToken = process.env.DISCORD_TOKEN!;

  const response = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to remove role: ${error}`);
  }
}
