import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashed,
      role: 'veteran',
      profile: {
        create: {
          branch: 'Army',
          rank: 'Sergeant',
          yearsOfService: 6,
          mos: '11B',
          resumeItems: {
            create: [
              { title: 'Team Leader', bullets: ['Led squad of 9 soldiers'] },
              { title: 'Instructor', bullets: ['Trained 100+ peers'] }
            ]
          }
        }
      }
    }
  })

  console.log('Seeded user:', user)
}

main().finally(() => prisma.$disconnect())
