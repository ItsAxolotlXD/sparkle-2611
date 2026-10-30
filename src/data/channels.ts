import { Channel, ProgramScheduleItem } from '../types';

interface RawChannelItem {
  id: string;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
}

const RAW_CHANNELS: RawChannelItem[] = [
  // Kênh VTV
  { id: 'vtv1', name: 'VTV1 HD', logo: 'https://img.vtvprime.vn/CK-rS1WbUz0mcRIodGxvvpqXiQB6XhphIkl2z7F_S_4/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvM2ZlMDdhZmQtYzIyZS00M2QwLTgyZTgtOWNkMGUyYTc3ZTRkLnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv1_paid/playlist.m3u8' },
  { id: 'vtv2', name: 'VTV2 HD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Logo_VTV2_-_%C4%90%C3%A0i_Truy%E1%BB%81n_h%C3%ACnh_Vi%E1%BB%87t_Nam.svg/500px-Logo_VTV2_-_%C4%90%C3%A0i_Truy%E1%BB%81n_h%C3%ACnh_Vi%E1%BB%87t_Nam.svg.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv2_paid/playlist.m3u8' },
  { id: 'vtv3', name: 'VTV3 HD', logo: 'https://img.vtvprime.vn/Urelv182xNl1mSeAyngHOYs6Ux6EXdkeaM7NPpTVxxQ/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZWJjNDJiMzAtN2ZjNS00Mjg1LThlOTUtY2VhNmVjMjkxMjI2LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv3_paid/playlist.m3u8' },
  { id: 'vtv4', name: 'VTV4 HD', logo: 'https://img.vtvprime.vn/ZHnw6RfJf-Bbc4AnYFh6fGTwD1M6W3nNPBNRsIMzrVs/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZTBlZDc3NjYtYTM0ZC00MWFlLWI1YjMtMGZjM2Q2ODhjNjU4LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv4_paid/playlist.m3u8' },
  { id: 'vn_today', name: 'VietNam Today', logo: 'https://img.vtvprime.vn/poWO4cMIOvlO4LFEoljeRHTNK-92PkmcxEiRMCjB4pM/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvMTE5YTVjNDYtMTZiMC00ZTUwLTlkNjItZmM1ZTJjZjQ3OTU4LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vntd_paid/playlist.m3u8' },
  { id: 'vtv5', name: 'VTV5 HD', logo: 'https://img.vtvprime.vn/HBQG6GvIODFr6E5umhq7hQsOvCBlVH_WHV4ApyOWw5U/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvOTQzZDQzMmMtOWZkZC00MWE0LWJiZjUtYWZiZmQ0YWY2YzFiLnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv5_paid/playlist.m3u8' },
  { id: 'vtv5_tay_nam_bo', name: 'VTV5 Tây Nam Bộ HD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/VTV5_T%C3%A2y_Nam_B%E1%BB%99.webp/500px-VTV5_T%C3%A2y_Nam_B%E1%BB%99.webp', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv5tnb_paid/playlist.m3u8' },
  { id: 'vtv5_tay_nguyen', name: 'VTV5 Tây Nguyên HD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Logo_m%E1%BB%9Bi_2026.webp/500px-Logo_m%E1%BB%9Bi_2026.webp', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv5tn_paid/playlist.m3u8' },
  { id: 'vtv6', name: 'VTV6 HD', logo: 'https://img.vtvprime.vn/KQxgbsme2VRA4cznEv_DWov9PSPSHURBY_UdIAHw1AQ/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvMWZjOWEzM2QtMjBkZS00ZTNiLWEwZWUtNTYxZjc5ZTY1M2E1LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv6_paid/playlist.m3u8' },
  { id: 'vtv7', name: 'VTV7 HD', logo: 'https://img.vtvprime.vn/YZrFZBwvKOzzZsRk27G0C2JOqkA5ALZTPc72fEnrCZs/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZTU1YWM1NjYtOThhNC00MDhiLWI1ODgtMjg3ZDRiMDczYmU2LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv7_paid/playlist.m3u8' },
  { id: 'vtv8', name: 'VTV8 HD', logo: 'https://img.vtvprime.vn/dRYDh8qf0U0AdBk0N6FheOKWRdv4nRcyvMh9s1_4wUM/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZGNiMTcxMmUtNDdlYy00ZDUyLTg3MWItNDUyYTRmMzJlYTA5LnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv8_paid/playlist.m3u8' },
  { id: 'vtv9', name: 'VTV9 HD', logo: 'https://img.vtvprime.vn/ex99djinSR4gpBal6_f_GON5IjWOqhAtmAmGePjIRnA/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZDk0Y2NmZDYtYjZjOS00NDA5LTg2MTYtNzVlZTE5OWMwNzhmLnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv9_paid/playlist.m3u8' },
  { id: 'vtv10', name: 'VTV10 HD', logo: 'https://img.vtvprime.vn/gis0m2zIPCwqsPz3alKrBrJevbPKkXJ_SkhjYgZ1gJQ/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvOGFlMTllZGYtZDU5Zi00OGRmLWIyMDgtZGE3OTQxMzE5NGZiLnBuZw==.png', category: 'Kênh VTV', streamUrl: 'https://vtvgoliveapp1-aws-plus-tn.vtvdigital.vn/aws/vtv10_paid/playlist.m3u8' },

  // Kênh VTVcab
  { id: 'on_trending', name: 'ON TRENDING TV HD', logo: 'https://img.vtvprime.vn/55xu-sW33ZbTdC_Jok1jkP6jWGpa3U96dXvvDuXoyz0/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvOGZjNzVhY2EtYjZhYS00MjYwLWIwMDMtZDRkYzg4OWI4ZGNkLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=186' },
  { id: 'on_kids', name: 'ON Kids HD', logo: 'https://img.vtvprime.vn/L7ERumqY3GEtK8vTe_DtMEJRYJkZPrVD3O4cbdT5P44/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvOGFlYmUzZGMtODZmYS00NGFkLTlhNzUtODg5NmFkODZhNGI3LnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=179' },
  { id: 'on_golf', name: 'ON Golf HD', logo: '/logos/on_golf.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=169' },
  { id: 'on_e_channel', name: 'ON E- Channel HD', logo: 'https://img.vtvprime.vn/bofK3Lca_KQJMc9sb6pUyQ_A41aWbsQi2ibNAzkN3I0/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZTk3YjgwOGUtNjI3OS00NWQ4LWJkMTAtNWY1MGE1MjIwMTZkLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=182' },
  { id: 'on_vie_giaitri', name: 'ON Vie Giải Trí HD', logo: 'https://img.vtvprime.vn/gV1k4G1mCGQpnNGJFCJQISd0-p96jY14Ufz_mOb8h_o/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZjVhZDhkNmBiMTQ4NS00YjYxLThhMDEtNTdiYzBiMjU2NGU1LnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=180' },
  { id: 'on_vie_dramas', name: 'ON Vie Dramas HD', logo: 'https://img.vtvprime.vn/mVzz9rvhJ_BCun2e4ILB0OYl8ptcxG9TsSrIZ85kpLk/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvMmExZjgwNGYtNjc0Yi00ZjYzLThjZWMtNjgwN2NkNThhYTRkLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'http://dvrfl05.bozztv.com/vch_vchannel18/tracks-v1a1/mono.m3u8' },
  { id: 'on_phimviet', name: 'ON Phim Việt HD', logo: 'https://img.vtvprime.vn/vDASEJI2IRP0eBox0ta6hgKo4vnY-3AdofWLa5lSqjM/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZTc3YzdkNmItZTVhNi00ZTkyLWIzYzUtMGEzMTkyZjIyM2RhLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=175' },
  { id: 'on_movies_youtv', name: 'ON Movies - You TV HD', logo: 'https://img.vtvprime.vn/8-eDFNeJkwyONvmJVu_JydPc2dZaNJXuBTY7vtvCxxE/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZWQzOTEzNjgtYTJmNy00NDBkLWI0N2ItNzA2MDliNjJmNDYzLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=181' },
  { id: 'on_o2tv', name: 'ON O2TV HD', logo: 'https://img.vtvprime.vn/5FxYjiz34GsArbti7aFiSkIO7NMCxKNZcQJ9AvIme80/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvODAyNGIwMDQtNGJiNC00M2Y3LWJkYmEtYmU0MWVkMGY0NjM4LnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=136' },
  { id: 'on_bibi', name: 'ON BiBi HD', logo: 'https://img.vtvprime.vn/vjXRRLGeFrNx1iAkqhrK9RoAgU1oW6kq5q_6r7cd9zs/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvYzI3NWExNmEtNTMwOS00ZWE3LWJjMjMtYTMyNGIwZDczNGJlLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=178' },
  { id: 'on_infotv', name: 'ON Info TV HD', logo: 'https://img.vtvprime.vn/nCr-YgSmtNg5gcpJ35d6l_T4DUWz8fzr9EJpd9jAZ6E/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvM2E2NzM5NzQtNzRhYi00MjYxLTg2M2QtZWE2YzUyNzU5YzcyLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=189' },
  { id: 'on_cine', name: 'ON Cine HD', logo: 'https://img.vtvprime.vn/XY6SjolNpy8W8Eh_v_2oDyE6BiNOvofLosgPYO-hlY4/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvZTY5YjgyNmUtNjkzYi00YzBiLWFhZmYtNmFhZGFjZjFhZDA0LnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=176' },
  { id: 'on_styletv', name: 'ON Style TV HD', logo: 'https://img.vtvprime.vn/TxObOi0p9hC6K414i12Fk27SP8s_QKswAvPaRH2kK6M/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvNTcyOGM3MzEtOWE4OS00ZjljLTkyYTItMWVhODZmNzhiOWE4LnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=184' },
  { id: 'on_music', name: 'ON Music HD', logo: 'https://img.vtvprime.vn/39RnkA6ZHfNSCcsMaaSivvTVwmWjeGsbqlQsmD7nuvQ/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvN7RmOTYzYTYtZWRkYS00MDdjLWIxYmYtYTAwODBhMTUyYTNlLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=185' },
  { id: 'on_vfamily', name: 'ON V Family HD', logo: 'https://img.vtvprime.vn/8oeGePxG0Z-iJqm5biFVNdMdAlVHFDYsS0i7i3IpH2Y/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvOGI0YzYzOTgtNWJiOS00ODQ1LWE1ZjMtZTdhZTM5ZTc4NzVmLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=187' },
  { id: 'on_life', name: 'ON Life HD', logo: 'https://img.vtvprime.vn/cJ9URVIqC2BkU1gsT0IKiEy0tXDXqu7C4M3Ni3hjlgY/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvY2U2MWMwZGEtMWI1Zi00ZWJiLWE4ZTktZjdmZTVkNzRlODhmLnBuZw==.png', category: 'Kênh VTVcab', streamUrl: 'https://vpsttt.vietanhtv.top/tv360/tv360.php?id=188' },

  // Kênh HTV
  { id: 'htv1', name: 'HTV1 HD', logo: '/logos/htv1.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv1_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'htv2', name: 'HTV2 / Vie Channel HD', logo: '/logos/htv2.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv2hd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htv3', name: 'HTV3 HD', logo: '/logos/htv3.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv3_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'htv4', name: 'HTV4 HD', logo: '/logos/htv4.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv4_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'htv5', name: 'HTV5 / B Channel HD', logo: '/logos/htv5.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/fnxsd1/btv9_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'htv7', name: 'HTV7 HD', logo: '/logos/htv7.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv7hd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htv9', name: 'HTV9 HD', logo: '/logos/htv9.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htv9hd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htv_thethao', name: 'HTV Thể Thao HD', logo: '/logos/htv_thethao.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcthethao_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_thethao', name: 'HTVC Thể Thao HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/d/d4/HTVC_Th%E1%BB%83_thao.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcthethao_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_canhac', name: 'HTVC Ca Nhạc HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/a/ad/HTVC_Ca_nh%E1%BA%A1c.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcmusic_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_dulich', name: 'HTVC Du Lịch HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/9/98/HTVC_Du_l%E1%BB%8Bch.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcdulich_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_giadinh', name: 'HTVC Gia Đình HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/1/18/HTVC_Gia_%C4%91%C3%ACnh.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcgiadinh_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_phimhd', name: 'HTVC Phim HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/3/36/HTVC_Phim.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcmovieshd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_phunu', name: 'HTVC Phụ Nữ HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/4/4e/HTVC_Ph%E1%BB%A5_n%E1%BB%AF.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcphunu_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_thuanviethd', name: 'HTVC Thuần Việt HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/3/3a/Thu%E1%BA%A7n_Vi%E1%BB%87t.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcthuanviethd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'htvc_plus_hd', name: 'HTVC+ HD', logo: 'https://upload.wikimedia.org/wikipedia/vi/e/ec/HTVC_Plus.png', category: 'Kênh HTV', streamUrl: 'https://live.fptplay53.net/epzhd1/htvcplus_vhls.smil/chunklist_b5000000.m3u8' },

  // Kênh thiết yếu
  { id: 'antv_thiet_yeu', name: 'Truyền hình Công an Nhân dân (ANTV) HD', logo: 'https://img-zlr1.tv360.vn/image1/2020_09_23/1600822516608/b33963dc0df8_640_360.png', category: 'Kênh thiết yếu', streamUrl: 'https://live.fptplay53.net/fnxhd2/anninhtv_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'qpvn_thiet_yeu', name: 'Truyền hình Quốc phòng Việt Nam (QPVN) HD', logo: '/logos/qpvn_thiet_yeu.png', category: 'Kênh thiết yếu', streamUrl: 'https://live.fptplay53.net/fnxhd2/quocphongvnhd_vhls.smil/chunklist_b5000000.m3u8' },

  // Kênh địa phương
  { id: 'atv1', name: 'Truyền hình An Giang - ATV1 HD', logo: '/logos/atv1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/angiang01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'atv2', name: 'Truyền hình An Giang - ATV2 HD', logo: '/logos/atv2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/angiang_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'atv3', name: 'Truyền hình An Giang - ATV3 HD', logo: '/logos/atv3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/angiang03_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'bac_ninh', name: 'Truyền hình Bắc Ninh - BTV HD', logo: '/logos/bac_ninh.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/bacninh01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'ca_mau', name: 'Truyền hình Cà Mau - CTV HD', logo: '/logos/ca_mau.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/camau_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'cao_bang', name: 'Truyền hình Cao Bằng - CRTV HD', logo: '/logos/cao_bang.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/caobang_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'can_tho_1', name: 'Truyền hình Cần Thơ - CầnThơ 1 HD', logo: '/logos/can_tho_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/cantho_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'can_tho_2', name: 'Truyền hình Cần Thơ - CầnThơ 2 HD', logo: '/logos/can_tho_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/cantho02_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'can_tho_3', name: 'Truyền hình Cần Thơ - CầnThơ 3 HD', logo: '/logos/can_tho_3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/cantho03_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'da_nang_1', name: 'Truyền hình Đà Nẵng - ĐNRT1 HD', logo: '/logos/da_nang_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/danang1_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'da_nang_2', name: 'Truyền hình Đà Nẵng - ĐNRT2 HD', logo: '/logos/da_nang_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/danang2_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'dak_lak', name: 'Truyền hình Đắk Lắk - DRT HD', logo: '/logos/dak_lak.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/daklak_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'dien_bien', name: 'Truyền hình Điện Biên - ĐTV HD', logo: '/logos/dien_bien.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/dienbien_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'dong_nai_1', name: 'Truyền hình Đồng Nai - ĐNRTV1 HD', logo: '/logos/dong_nai_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/dongnai1_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'dong_nai_2', name: 'Truyền hình Đồng Nai - ĐNRTV2 HD', logo: '/logos/dong_nai_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/dongnai2_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'gia_lai', name: 'Truyền hình Gia Lai - GTV HD', logo: '/logos/gia_lai.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/gialai01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'dong_thap_1', name: 'Truyền hình Đồng Tháp - THĐT1 HD', logo: '/logos/dong_thap_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/dongthap_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'dong_thap_2', name: 'Truyền hình Đồng Tháp - THĐT2 HD', logo: '/logos/dong_thap_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/dongthaphd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'ha_noi_1', name: 'Truyền hình Hà Nội - H1 HD', logo: '/logos/ha_noi_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxhd2/hanoitv1_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'ha_noi_2', name: 'Truyền hình Hà Nội - H2 HD', logo: '/logos/ha_noi_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxhd1/hntv2_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'hue', name: 'Truyền hình Huế - HueTV HD', logo: '/logos/hue.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/hue_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'ha_tinh', name: 'Truyền hình Hà Tĩnh - HTTV HD', logo: '/logos/ha_tinh.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/hatinh_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'hai_phong', name: 'Truyền hình Hải Phòng - THP HD', logo: '/logos/hai_phong.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/haiphong_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'hai_phong_3', name: 'Truyền hình Hải Phòng - THP3 HD', logo: '/logos/hai_phong_3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/haiphongplus_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'hung_yen', name: 'Truyền hình Hưng Yên - HYTV HD', logo: '/logos/hung_yen.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/hungyen_2000.stream/chunklist_b2500000.m3u8' },
  { id: 'khanh_hoa', name: 'Truyền hình Khánh Hòa - KTV HD', logo: '/logos/khanh_hoa.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/khanhhoa_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'khanh_hoa_1', name: 'Truyền hình Khánh Hòa - KTV1 HD', logo: '/logos/khanh_hoa_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/khanhhoa01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lai_chau', name: 'Truyền hình Lai Châu - LTV HD', logo: '/logos/lai_chau.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/laichau_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lao_cai', name: 'Truyền hình Lào Cai - THLC HD', logo: '/logos/lao_cai.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/laocai_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lang_son', name: 'Truyền hình Lạng Sơn - LSTV HD', logo: '/logos/lang_son.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/langson_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lam_dong_1', name: 'Truyền hình Lâm Đồng - LTV1 HD', logo: '/logos/lam_dong_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/lamdong_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lam_dong_2', name: 'Truyền hình Lâm Đồng - LTV2 HD', logo: '/logos/lam_dong_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/lamdong02_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'lam_dong_3', name: 'Truyền hình Lâm Đồng - LTV3 HD', logo: '/logos/lam_dong_3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/lamdong03_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'nghe_an', name: 'Truyền hình Nghệ An - NTV HD', logo: 'https://img-zlr1.tv360.vn/image1/2020_09_23/1600821989411/75bfb004e210_640_360.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/nghean_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'ninh_binh', name: 'Truyền hình Ninh Bình - NBTV HD', logo: '/logos/ninh_binh.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/ninhbinh_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'phu_tho', name: 'Truyền hình Phú Thọ - PTV HD', logo: '/logos/phu_tho.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/phutho_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'quang_ninh_1', name: 'Truyền hình Quảng Ninh - QTV1 HD', logo: '/logos/quang_ninh_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/quangninh1_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'quang_ninh_3', name: 'Truyền hình Quảng Ninh - QTV3 HD', logo: '/logos/quang_ninh_3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/quangninh3_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'quang_ngai_1', name: 'Truyền hình Quảng Ngãi - QNgTV1 HD', logo: '/logos/quang_ngai_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/quangngai_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'quang_ngai_2', name: 'Truyền hình Quảng Ngãi - QNgTV2 HD', logo: '/logos/quang_ngai_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/quangngai01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'tay_ninh', name: 'Truyền hình Tây Ninh - TN HD', logo: '/logos/tay_ninh.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/tayninh01_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'son_la', name: 'Truyền hình Sơn La - Snews HD', logo: '/logos/son_la.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/sonla_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'quang_tri', name: 'Truyền hình Quảng Trị - QTTV HD', logo: '/logos/quang_tri.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/quangtri_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'tuyen_quang', name: 'Truyền hình Tuyên Quang - TTV HD', logo: '/logos/tuyen_quang.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/tuyenquang_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'thanh_hoa', name: 'Truyền hình Thanh Hóa - TTV HD', logo: '/logos/thanh_hoa.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/thanhhoa_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'thai_nguyen', name: 'Truyền hình Thái Nguyên - TN HD', logo: '/logos/thai_nguyen.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/fnxsd1/thainguyen_hls.smil/chunklist_b2500000.m3u8' },
  { id: 'vinh_long_1', name: 'Truyền hình Vĩnh Long - THVL1 HD', logo: '/logos/vinh_long_1.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzhd2/vinhlong1_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'vinh_long_2', name: 'Truyền hình Vĩnh Long - THVL2 HD', logo: '/logos/vinh_long_2.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzhd2/vinhlong2_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'vinh_long_3', name: 'Truyền hình Vĩnh Long - THVL3 HD', logo: '/logos/vinh_long_3.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzhd2/vinhlong3_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'vinh_long_4', name: 'Truyền hình Vĩnh Long - THVL4 HD', logo: '/logos/vinh_long_4.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzhd2/vinhlong4hd_vhls.smil/chunklist_b5000000.m3u8' },
  { id: 'vinh_long_5', name: 'Truyền hình Vĩnh Long - THVL5 HD', logo: '/logos/vinh_long_5.png', category: 'Kênh địa phương', streamUrl: 'https://live.fptplay53.net/epzsd1/vinhlong5_vhls.smil/chunklist_b5000000.m3u8' },

  // Kênh phát thanh
  { id: 'vov1', name: 'VOV1', logo: '/logos/vov1.png', category: 'Kênh phát thanh', streamUrl: 'https://media-audio.vov.vn/vov1vov5Vietnamese.sdp_aac/playlist.m3u8' },
  { id: 'vov2', name: 'VOV2', logo: '/logos/vov2.png', category: 'Kênh phát thanh', streamUrl: 'https://media-audio.vov.vn/vov2.sdp_aac/playlist.m3u8' },
  { id: 'vov3', name: 'VOV3', logo: '/logos/vov3.png', category: 'Kênh phát thanh', streamUrl: 'https://media-audio.vov.vn/vov3.sdp_aac/playlist.m3u8' },
  { id: 'vov4', name: 'VOV4', logo: '/logos/vov4.png', category: 'Kênh phát thanh', streamUrl: 'http://media.kythuatvov.vn:1936/live/VOV4_TB.sdp/chunklist.m3u8' },
  { id: 'vov4_tb', name: 'VOV4 Tây Bắc', logo: '/logos/vov4.png', category: 'Kênh phát thanh', streamUrl: 'http://media.kythuatvov.vn:1936/live/VOV4_TB.sdp/chunklist.m3u8' },
  { id: 'vov4_tn', name: 'VOV4 Tây Nguyên', logo: '/logos/vov4.png', category: 'Kênh phát thanh', streamUrl: 'https://str.vov.gov.vn/vovlive/vov4.TayNguyen.sdp_aac/playlist.m3u8' },
  { id: 'vov5', name: 'VOV5', logo: '/logos/vov5.png', category: 'Kênh phát thanh', streamUrl: 'https://media-audio.vov.vn/vov5.sdp_aac/playlist.m3u8' },
  { id: 'vov_giao_thong', name: 'VOV Giao Thông', logo: '/logos/vov_giao_thong.png', category: 'Kênh phát thanh', streamUrl: 'https://play.vovgiaothong.vn/live/gthn/playlist.m3u8' },
  { id: 'vov_gt_hn', name: 'VOV Giao Thông Hà Nội', logo: '/logos/vov_giao_thong.png', category: 'Kênh phát thanh', streamUrl: 'https://play.vovgiaothong.vn/live/gthn/playlist.m3u8' },
  { id: 'vov_gt_hcm', name: 'VOV Giao Thông TP.HCM', logo: '/logos/vov_giao_thong.png', category: 'Kênh phát thanh', streamUrl: 'https://play.vovgiaothong.vn/live/gthcm/playlist.m3u8' },
  { id: 'vov_gt_mekong', name: 'VOV Giao Thông Mê Kông', logo: '/logos/vov_giao_thong.png', category: 'Kênh phát thanh', streamUrl: 'https://play.vovgiaothong.vn/live/mekong/playlist.m3u8' },
  { id: 'vov_gt_duyenhai', name: 'VOV Giao Thông Duyên Hải', logo: '/logos/vov_giao_thong.png', category: 'Kênh phát thanh', streamUrl: 'https://play.vovgiaothong.vn/live/duyenhai2/playlist.m3u8' },
  { id: 'hanoi_fm90', name: 'Hà Nội FM90', logo: '/logos/hanoi_fm90.png', category: 'Kênh phát thanh', streamUrl: 'http://14.162.146.90:8000/HANOI90' },
  { id: 'hanoi_fm96', name: 'Hà Nội FM96', logo: '/logos/hanoi_fm96.png', category: 'Kênh phát thanh', streamUrl: 'http://222.252.21.96:8000/HANOI96' }
];

export const CHANNELS_DATA: Channel[] = RAW_CHANNELS.map((item, idx) => {
  const chNum = idx + 1;
  const chCode = String(chNum).padStart(3, '0');
  return {
    id: item.id,
    name: item.name,
    shortName: item.name.replace(/ HD| —.*/g, ''),
    channelNumber: chNum,
    channelCode: chCode,
    slug: item.id,
    logo: item.logo,
    category: item.category,
    quality: item.name.includes('HD') ? 'HD' : item.category === 'Kênh phát thanh' ? 'SD' : 'HD',
    streamUrl: item.streamUrl,
    isLive: true,
    viewers: Math.floor(1800 + Math.abs(Math.sin(idx + 1)) * 32000),
    currentProgram: {
      title: item.category === 'Kênh phát thanh'
        ? `${item.name} — Trực tuyến`
        : `${item.name}`,
      startTime: '19:00',
      endTime: '21:00',
      progress: 45 + (idx % 40),
      description: `Kênh truyền hình ${item.name} (${item.category}).`
    },
    nextProgram: {
      title: item.category === 'Kênh phát thanh'
        ? 'Chương trình tiếp nối'
        : 'Bản tin tiếp theo',
      startTime: '21:00'
    },
    description: `Kênh ${item.name} (${item.category}).`,
    resolution: item.category === 'Kênh phát thanh' ? 'Audio Stream' : '1080p Full HD',
    bitrate: item.category === 'Kênh phát thanh' ? '128 - 320 kbps' : '6.5 - 9.0 Mbps HLS',
    tags: [item.category, item.name, chCode, String(chNum)]
  };
});

export const SCHEDULE_DATA: Record<string, ProgramScheduleItem[]> = {
  vtv1: [
    { id: 'v1-1', channelId: 'vtv1', startTime: '18:30', endTime: '19:00', title: 'Việt Nam hôm nay', category: 'Chính luận', description: 'Phân tích các vấn đề kinh tế xã hội.' },
    { id: 'v1-2', channelId: 'vtv1', startTime: '19:00', endTime: '19:50', title: 'Thời sự 19h Quốc gia', category: 'Thời sự', description: 'Bản tin chính luận trọng điểm quốc gia.', isLive: true },
    { id: 'v1-3', channelId: 'vtv1', startTime: '20:00', endTime: '20:45', title: 'Vấn đề hôm nay — Tọa đàm', category: 'Tọa đàm', description: 'Diễn đàn đối thoại trực tiếp.' }
  ],
  vtv3: [
    { id: 'v3-1', channelId: 'vtv3', startTime: '19:00', endTime: '20:00', title: 'Tiếp sóng Thời sự 19h VTV', category: 'Thời sự', description: 'Tiếp sóng tin tức thời sự.' },
    { id: 'v3-2', channelId: 'vtv3', startTime: '20:00', endTime: '21:00', title: 'Phim truyện: Mùa hè năm ấy', category: 'Phim truyện', description: 'Phim truyền hình Việt Nam VFC - Đạo diễn Lê Đỗ Ngọc Linh.', isLive: true },
    { id: 'v3-3', channelId: 'vtv3', startTime: '21:00', endTime: '22:00', title: 'Cuộc hẹn cuối tuần', category: 'Giải trí', description: 'Talkshow nghệ thuật sống động.' }
  ],
  vtv4: [
    { id: 'v4-1', channelId: 'vtv4', startTime: '19:00', endTime: '20:00', title: 'Thời sự VTV4', category: 'Tin tức', description: 'Bản tin đối ngoại.' },
    { id: 'v4-2', channelId: 'vtv4', startTime: '20:00', endTime: '21:00', title: 'VIETNAM TODAY: Kết nối Thế giới', category: 'Đối ngoại', description: 'Cửa sổ thông tin của Việt Nam ra thế giới.', isLive: true },
    { id: 'v4-3', channelId: 'vtv4', startTime: '21:00', endTime: '21:45', title: 'Vietnam Today English News 9PM', category: 'English', description: 'Daily news in English.' }
  ]
};
