import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'Admin1@gmail.com',
      password: 'Admin123',
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