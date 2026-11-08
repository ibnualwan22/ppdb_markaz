/**
 * Sumber tunggal struktur menu admin PPDB + pemetaan permisi ke menu.
 *
 * Dipakai oleh:
 * - app/admin/layout.tsx (sidebar — href/label/permission tiap menu)
 * - app/admin/role/page.tsx (Manajemen Role — menampilkan tiap permisi
 *   beserta menu yang dibukanya, dengan tulisan yang sama seperti sidebar)
 *
 * Kalau menambah/mengubah menu di sidebar, ubah di sini — kedua tempat
 * ikut berubah. Kalau menambah permisi aksi baru, daftarkan di
 * `actionPermissionMenu` agar muncul di Manajemen Role dengan menu yang benar.
 */

export interface AdminMenuItem {
  href: string;
  label: string;
  /** Kode permisi penjaga menu; null = semua user boleh (misal Profil Saya). */
  permission: string | null;
}

export interface AdminMenuSection {
  title: string;
  items: AdminMenuItem[];
}

/** Urutan + tulisan sama persis seperti sidebar (app/admin/layout.tsx). */
export const adminMenuSections: AdminMenuSection[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/admin/", label: "Halaman Utama", permission: "view_dashboard" },
      { href: "/admin/dashboard", label: "Dashboard Muasis", permission: "view_dashboard" },
      { href: "/admin/pendaftaran", label: "Meja Keuangan", permission: "view_keuangan" },
      { href: "/admin/asrama", label: "Meja Asrama", permission: "view_asrama" },
      { href: "/admin/asrama/mutasi", label: "Mutasi Sakan", permission: "view_asrama" },
      { href: "/admin/asrama/mutasi-kategori", label: "Mutasi Kategori", permission: "view_asrama" },
      { href: "/admin/id-card", label: "Meja ID Card", permission: "view_idcard" },
      { href: "/admin/mimstore", label: "Mim Store", permission: "view_mimstore" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/admin/master", label: "Master Lokasi", permission: "manage_asrama" },
      { href: "/admin/master/program", label: "Master Program", permission: "view_program" },
      { href: "/admin/master/kategori-program", label: "Master Kategori", permission: "view_program" },
      { href: "/admin/master/pengajar", label: "Dewan Asatidz", permission: "view_program" },
      { href: "/admin/dufah", label: "Manajemen Duf'ah", permission: "manage_dufah" },
      { href: "/admin/santri", label: "Master Santri", permission: "view_santri" },
      { href: "/admin/santri/tanpa-nis", label: "Santri Tanpa NIS", permission: "view_santri" },
    ],
  },
  {
    title: "Security & Akun",
    items: [
      { href: "/admin/akun", label: "Manajemen Akun", permission: "manage_users" },
      { href: "/admin/role", label: "Manajemen Role", permission: "manage_roles" },
      { href: "/admin/activity-log", label: "Log Aktivitas", permission: "view_activity_log" },
      { href: "/admin/profil", label: "Profil Saya", permission: null },
    ],
  },
];

export interface PermissionMenuRef {
  section: string;
  menu: string;
}

/**
 * Permisi aksi (bukan penjaga menu) -> menu tempat aksinya dipakai.
 * Diisi manual berdasarkan pemakaian di kode; kalau permisi aksi baru
 * ditambahkan, daftarkan di sini.
 */
const actionPermissionMenu: Record<string, PermissionMenuRef[]> = {
  // Meja Keuangan (app/admin/pendaftaran/page.tsx)
  verify_pendaftaran: [{ section: "Menu Utama", menu: "Meja Keuangan" }],
  bypass_ksu: [{ section: "Menu Utama", menu: "Meja Keuangan" }],
  export_laporan_keuangan: [{ section: "Menu Utama", menu: "Meja Keuangan" }],
  // Meja Asrama (app/admin/asrama/page.tsx)
  assign_lemari: [{ section: "Menu Utama", menu: "Meja Asrama" }],
  // Dashboard Muasis (app/admin/dashboard/page.tsx)
  lock_kamar: [{ section: "Menu Utama", menu: "Dashboard Muasis" }],
  // Mim Store (app/admin/mimstore/page.tsx)
  manage_mimstore: [{ section: "Menu Utama", menu: "Mim Store" }],
  // Meja ID Card (app/admin/id-card/page.tsx)
  manage_idcard: [{ section: "Menu Utama", menu: "Meja ID Card" }],
  // Master Program + Master Kategori + Dewan Asatidz
  manage_program: [
    { section: "Pengaturan", menu: "Master Program" },
    { section: "Pengaturan", menu: "Master Kategori" },
    { section: "Pengaturan", menu: "Dewan Asatidz" },
  ],
  // Master Santri (app/admin/santri/page.tsx)
  edit_masa_aktif: [{ section: "Pengaturan", menu: "Master Santri" }],
  manage_santri: [{ section: "Pengaturan", menu: "Master Santri" }],
};

/** Permisi langganan notifikasi — bukan menu, dikelompokkan sendiri. */
const notificationPermissions = [
  "receive_notif_idcard",
  "receive_notif_pendaftaran_baru",
  "receive_notif_plot_asrama",
  "receive_notif_status_santri",
];

const SECTION_ORDER = ["Menu Utama", "Pengaturan", "Security & Akun", "Notifikasi", "Lainnya"];

/** Semua menu (label + seksi) yang dibuka oleh satu kode permisi. */
export function getPermissionMenus(namaAksi: string): PermissionMenuRef[] {
  if (namaAksi === "all_access") return [];
  const fromActions = actionPermissionMenu[namaAksi];
  if (fromActions) return fromActions;
  const fromMenus: PermissionMenuRef[] = [];
  for (const section of adminMenuSections) {
    for (const item of section.items) {
      if (item.permission === namaAksi) fromMenus.push({ section: section.title, menu: item.label });
    }
  }
  if (fromMenus.length > 0) return fromMenus;
  if (notificationPermissions.includes(namaAksi)) {
    return [{ section: "Notifikasi", menu: "Notifikasi" }];
  }
  return [];
}

export interface PermissionLike {
  id: string;
  namaAksi: string;
  deskripsi?: string | null;
}

export interface GroupedPermission {
  permission: PermissionLike;
  /** Label menu (tulisan sama seperti sidebar) yang dibuka permisi ini. */
  menus: string[];
}

export interface PermissionGroup {
  section: string;
  items: GroupedPermission[];
}

/**
 * Kelompokkan daftar permisi untuk form Manajemen Role: urutan seksi sama
 * seperti sidebar, tiap permisi muncul sekali dengan daftar menu yang dibukanya.
 * Permisi yang belum dipetakan masuk seksi "Lainnya" agar tetap tampil.
 */
export function groupPermissionsForForm(list: PermissionLike[]): PermissionGroup[] {
  const bySection = new Map<string, GroupedPermission[]>();
  const orderOf = (section: string, menu: string): [number, number] => {
    const sIdx = adminMenuSections.findIndex((s) => s.title === section);
    if (sIdx >= 0) {
      const mIdx = adminMenuSections[sIdx].items.findIndex((i) => i.label === menu);
      return [sIdx, mIdx >= 0 ? mIdx : 99];
    }
    return [SECTION_ORDER.indexOf(section), 0];
  };
  const grouped: { section: string; menus: string[]; permission: PermissionLike; sort: [number, number] }[] = [];
  for (const permission of list) {
    if (permission.namaAksi === "all_access") continue;
    const refs = getPermissionMenus(permission.namaAksi);
    const section = refs.length > 0 ? refs[0].section : "Lainnya";
    const menus = refs.map((r) => r.menu);
    const sorts = refs.map((r) => orderOf(r.section, r.menu));
    sorts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    grouped.push({ section, menus, permission, sort: sorts.length > 0 ? sorts[0] : [SECTION_ORDER.indexOf("Lainnya"), 0] });
  }
  grouped.sort((a, b) => {
    const sA = SECTION_ORDER.indexOf(a.section);
    const sB = SECTION_ORDER.indexOf(b.section);
    if (sA !== sB) return sA - sB;
    if (a.sort[0] !== b.sort[0]) return a.sort[0] - b.sort[0];
    if (a.sort[1] !== b.sort[1]) return a.sort[1] - b.sort[1];
    return a.permission.namaAksi.localeCompare(b.permission.namaAksi);
  });
  for (const g of grouped) {
    const arr = bySection.get(g.section) || [];
    arr.push({ permission: g.permission, menus: g.menus });
    bySection.set(g.section, arr);
  }
  return SECTION_ORDER.filter((s) => bySection.has(s)).map((s) => ({ section: s, items: bySection.get(s) || [] }));
}

/**
 * Label menu (tulisan sama seperti sidebar, urutan sidebar, tanpa duplikat)
 * yang bisa dibuka oleh daftar kode permisi — untuk kartu role.
 */
export function getMenuLabelsForPermissions(namaAksiList: string[]): string[] {
  const labels = new Set<string>();
  for (const section of adminMenuSections) {
    for (const item of section.items) {
      if (item.permission && namaAksiList.includes(item.permission)) labels.add(item.label);
    }
  }
  for (const namaAksi of namaAksiList) {
    for (const ref of getPermissionMenus(namaAksi)) labels.add(ref.menu);
  }
  const pos = new Map<string, [number, number]>();
  adminMenuSections.forEach((section, sIdx) => {
    section.items.forEach((item, mIdx) => {
      if (!pos.has(item.label)) pos.set(item.label, [sIdx, mIdx]);
    });
  });
  return [...labels].sort((a, b) => {
    const pa = pos.get(a) || [99, 99];
    const pb = pos.get(b) || [99, 99];
    return pa[0] - pb[0] || pa[1] - pb[1] || a.localeCompare(b);
  });
}
