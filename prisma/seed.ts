import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Definition of all application permissions
  const permissionsList = [
    { namaAksi: 'all_access', deskripsi: 'Akses penuh ke semua fitur (Super Admin)' },
    { namaAksi: 'manage_users', deskripsi: 'Mengelola data kredensial/akun pengguna' },
    { namaAksi: 'manage_roles', deskripsi: 'Mengelola daftar dan hak akses peran (Role)' },
    
    // Asrama & Sakan
    { namaAksi: 'view_asrama', deskripsi: 'Melihat meja asrama & data kamar' },
    { namaAksi: 'manage_asrama', deskripsi: 'Menambah/mengedit data sakan dan kamar' },
    { namaAksi: 'assign_lemari', deskripsi: 'Mengatur penempatan santri ke lemari/kamar' },
    { namaAksi: 'lock_kamar', deskripsi: 'Mengunci/Membuka akses Lemari di Kamar' },
    
    // Master Santri & Dufah
    { namaAksi: 'view_santri', deskripsi: 'Melihat data master santri' },
    { namaAksi: 'manage_santri', deskripsi: 'Menambah, mengedit, menghapus master santri' },
    { namaAksi: 'manage_dufah', deskripsi: 'Membuka dan menutup periode pendaftaran (Dufah)' },
    
    // ID Card
    { namaAksi: 'view_idcard', deskripsi: 'Melihat antrean cetak ID Card' },
    { namaAksi: 'manage_idcard', deskripsi: 'Menandai status pengambilan ID Card' },
    
    // Mim Store
    { namaAksi: 'view_mimstore', deskripsi: 'Melihat progress pengambilan item Mims Store' },
    { namaAksi: 'manage_mimstore', deskripsi: 'Menandai status pengambilan atribut santri' },

    // Dashboard
    { namaAksi: 'view_dashboard', deskripsi: 'Melihat layar dashboard (Grafik & Statistik)' }
  ]

  // Upsert all permissions
  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { namaAksi: perm.namaAksi },
      update: { deskripsi: perm.deskripsi }, // Update deskripsi jika ada perubahan
      create: perm,
    })
  }

  console.log('Permissions seeded.')
  
  // Ambil permission all_access untuk Super Admin
  const allAccessPermission = await prisma.permission.findUnique({
    where: { namaAksi: 'all_access' }
  })

  if (!allAccessPermission) throw new Error("Permission all_access gagal dibuat")

  // 2. Create default Role
  const superAdminRole = await prisma.role.upsert({
    where: { nama: 'Super Admin' },
    update: {}, // Jangan timpa jika sudah ada manual modifications dari UI (kecuali all_access)
    create: {
      nama: 'Super Admin',
      permissions: {
        create: {
          permissionId: allAccessPermission.id,
        },
      },
    },
  })
  
  // Paksa set all_access ke Super Admin jika ada update (opsional tapi aman)
  const exitingRolePerm = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: superAdminRole.id,
        permissionId: allAccessPermission.id
      }
    }
  })
  
  if (!exitingRolePerm) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: allAccessPermission.id
      }
    })
  }

  console.log('Role "Super Admin" seeded.')

  // 3. Create default User
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    // Jangan update password jika admin sudah ada (agar password login di UI tidak kereplace default)
    update: {}, 
    create: {
      username: 'admin',
      password: adminPassword,
      nama: 'Administrator',
      roleId: superAdminRole.id,
    },
  })
  console.log('User "admin" seeded.')

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
