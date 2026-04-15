import type { VbeeVoice } from '@/types'

export const VBEE_VOICES: VbeeVoice[] = [
  // Miền Bắc
  { id: 'hn_female_ngochuyen_full_48k-fhg', name: 'Ngọc Huyền', region: 'Bắc', gender: 'Nữ' },
  { id: 'hn_male_minhquang_full_48k-fhg',   name: 'Minh Quang', region: 'Bắc', gender: 'Nam' },
  { id: 'hn_female_thungan_full_48k-fhg',   name: 'Thu Ngân',   region: 'Bắc', gender: 'Nữ' },
  { id: 'hn_male_thanhlong_full_48k-fhg',   name: 'Thanh Long', region: 'Bắc', gender: 'Nam' },
  { id: 'hn_female_maiphuong_full_48k-fhg', name: 'Mai Phương', region: 'Bắc', gender: 'Nữ' },
  // Miền Trung
  { id: 'hue_female_full_48k-fhg',          name: 'Giọng Huế',  region: 'Trung', gender: 'Nữ' },
  { id: 'hue_male_full_48k-fhg',            name: 'Giọng Huế',  region: 'Trung', gender: 'Nam' },
  // Miền Nam
  { id: 'sg_female_thaotrinh_full_48k-fhg', name: 'Thảo Trinh', region: 'Nam', gender: 'Nữ' },
  { id: 'sg_male_minhtan_full_48k-fhg',     name: 'Minh Tân',   region: 'Nam', gender: 'Nam' },
  { id: 'sg_female_ngoclan_full_48k-fhg',   name: 'Ngọc Lan',   region: 'Nam', gender: 'Nữ' },
  { id: 'sg_male_namgiang_full_48k-fhg',    name: 'Nam Giang',  region: 'Nam', gender: 'Nam' },
]

export const DEFAULT_VBEE_VOICE = VBEE_VOICES[0].id
