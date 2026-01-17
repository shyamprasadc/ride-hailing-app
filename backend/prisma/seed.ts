import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.rider.deleteMany();

  // Create Riders
  const riders = await Promise.all([
    prisma.rider.create({
      data: {
        name: 'Alice Johnson',
        phone: '+1234567890',
        email: 'alice@example.com',
      },
    }),
    prisma.rider.create({
      data: {
        name: 'Bob Smith',
        phone: '+1234567891',
        email: 'bob@example.com',
      },
    }),
    prisma.rider.create({
      data: {
        name: 'Charlie Brown',
        phone: '+1234567892',
        email: 'charlie@example.com',
      },
    }),
  ]);

  console.log(`✅ Created ${riders.length} riders`);

  // Create Drivers (5 AVAILABLE, 5 ASSIGNED)
  const driverData = [
    // AVAILABLE drivers
    { name: 'David Wilson', phone: '+1111111111', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.7749, lng: -122.4194 },
    { name: 'Emma Davis', phone: '+1111111112', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.7849, lng: -122.4094 },
    { name: 'Frank Miller', phone: '+1111111113', status: 'AVAILABLE', tier: 'PREMIUM', lat: 37.7649, lng: -122.4294 },
    { name: 'Grace Lee', phone: '+1111111114', status: 'AVAILABLE', tier: 'PREMIUM', lat: 37.7949, lng: -122.3994 },
    { name: 'Henry Taylor', phone: '+1111111115', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.7549, lng: -122.4394 },
    // ASSIGNED drivers (simulating ongoing rides)
    { name: 'Ivy Anderson', phone: '+1111111116', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.8049, lng: -122.3894 },
    { name: 'Jack Thomas', phone: '+1111111117', status: 'AVAILABLE', tier: 'PREMIUM', lat: 37.7449, lng: -122.4494 },
    { name: 'Kelly White', phone: '+1111111118', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.8149, lng: -122.3794 },
    { name: 'Liam Harris', phone: '+1111111119', status: 'AVAILABLE', tier: 'PREMIUM', lat: 37.7349, lng: -122.4594 },
    { name: 'Mia Martin', phone: '+1111111120', status: 'AVAILABLE', tier: 'ECONOMY', lat: 37.8249, lng: -122.3694 },
  ];

  const drivers = await Promise.all(
    driverData.map((data) =>
      prisma.driver.create({
        data: {
          name: data.name,
          phone: data.phone,
          status: data.status as any,
          tier: data.tier as any,
          latitude: data.lat,
          longitude: data.lng,
        },
      })
    )
  );

  console.log(`✅ Created ${drivers.length} drivers (5 AVAILABLE, 5 ASSIGNED)`);

  console.log('🎉 Seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Riders: ${riders.length}`);
  console.log(`   - Drivers: ${drivers.length}`);
  console.log(`   - Available Drivers: ${drivers.filter((d) => d.status === 'AVAILABLE').length}`);
  console.log('\n🚀 You can now start the server and test the APIs!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
