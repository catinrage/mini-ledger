import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get or create settings with default passkey
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        baselineBalance: 0,
        passkey: '1234',
      },
    });
    console.log('Settings created with default passkey: 1234');
  } else {
    // Update passkey to default if needed
    if (!settings.passkey) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { passkey: '1234' },
      });
      console.log('Settings updated with default passkey: 1234');
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
