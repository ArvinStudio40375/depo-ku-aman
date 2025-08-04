-- Insert notifications for user Siti Aminah using proper UUID
INSERT INTO public.notifikasi (user_id, tipe, isi, dibaca, tanggal) VALUES 
(gen_random_uuid(), 'sistem', 'Saldo Rp.10.000.000,- Berhasil Ditambahkan|Untuk Tunjangan Kesehatan', false, now()),
(gen_random_uuid(), 'sistem', 'Saldo Rp.10.000.000,- Berhasil Ditambahkan|Untuk Tunjangan Konsumsi', false, now()),
(gen_random_uuid(), 'sistem', 'Saldo Rp.15.000.000,- Berhasil Ditambahkan|Untuk Gaji Bulan Mei,Juni, Juli 2025', false, now()),
(gen_random_uuid(), 'sistem', 'Saldo Rp.10.000.000,- Berhasil Ditambahkan|Untuk Tunjangan Transportasi', false, now());