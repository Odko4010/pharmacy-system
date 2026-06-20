import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'Admin1@gmail.com',
      password: hashedPassword,
      firstName: 'Админ',
      lastName: 'Систем',
      role: 'ADMIN',
    },
  })
  
  console.log('Admin үүсгэгдлээ:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())