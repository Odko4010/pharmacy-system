import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
dotenv.config()

console.log('DATABASE_URL:', process.env.DATABASE_URL)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'Odko4010@gmail.com',
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