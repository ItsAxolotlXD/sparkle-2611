import { Channel } from '../types';

/**
 * Robust M3U / M3U8 Playlist Parser
 * Supports #EXTM3U, #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...", Channel Name
 */
export function parseM3UPlaylist(m3uContent: string): Partial<Channel>[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Partial<Channel>[] = [];

  let currentInfo: {
    tvgId?: string;
    tvgName?: string;
    tvgLogo?: string;
    groupTitle?: string;
    title?: string;
  } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      if (idMatch) currentInfo.tvgId = idMatch[1];

      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch) currentInfo.tvgLogo = logoMatch[1];

      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      if (groupMatch) currentInfo.groupTitle = groupMatch[1];

      // Extract tvg-name
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      if (nameMatch) currentInfo.tvgName = nameMatch[1];

      // Extract channel title (after the comma at end of line)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentInfo.title = line.substring(commaIndex + 1).trim();
      } else if (currentInfo.tvgName) {
        currentInfo.title = currentInfo.tvgName;
      }
    } else if (!line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://') || line.endsWith('.m3u8') || line.endsWith('.ts'))) {
      const title = currentInfo.title || currentInfo.tvgName || `Kênh ${channels.length + 1}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `channel-${Date.now()}`;
      
      const groupTitle = (currentInfo.groupTitle || '').toUpperCase();
      let category: Channel['category'] = 'Chuyên biệt';
      if (groupTitle.includes('VTV')) category = 'VTV';
      else if (groupTitle.includes('HTV')) category = 'HTV';
      else if (groupTitle.includes('VTC')) category = 'VTC';
      else if (groupTitle.includes('ĐỊA PHƯƠNG') || groupTitle.includes('TỈNH')) category = 'Địa phương';
      else if (groupTitle.includes('QUỐC TẾ') || groupTitle.includes('WORLD')) category = 'Quốc tế';

      const isHD = title.toUpperCase().includes('HD') || title.toUpperCase().includes('1080');
      const is4K = title.toUpperCase().includes('4K') || title.toUpperCase().includes('UHD');

      channels.push({
        id: currentInfo.tvgId || `custom-${Date.now()}-${channels.length}`,
        name: title,
        slug: slug,
        logo: currentInfo.tvgLogo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
        category: category,
        quality: is4K ? '4K' : (isHD ? 'HD' : 'SD'),
        streamUrl: line,
        isLive: true,
        description: `Luồng phát sóng trực tiếp ${title}`,
        currentProgram: {
          title: `Đang phát sóng: ${title}`,
          startTime: '00:00',
          endTime: '24:00',
          progress: 50,
          description: 'Chương trình trực tiếp theo khung giờ phát sóng đài truyền hình.'
        }
      });
      currentInfo = {};
    }
  }

  return channels;
}

export function exportToM3U(channels: Channel[]): string {
  let output = '#EXTM3U\n\n';
  channels.forEach((ch) => {
    output += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.category}", ${ch.name}\n`;
    output += `${ch.streamUrl}\n\n`;
  });
  return output;
}

export function downloadPlaylistFile(channels: Channel[], filename = 'v_one_channels.m3u8') {
  const content = exportToM3U(channels);
  const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const SAMPLE_M3U_TEMPLATE = `#EXTM3U
#EXTINF:-1 tvg-id="vtv1-hd" tvg-name="VTV1 HD" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/VTV1_logo_2013_final.svg/200px-VTV1_logo_2013_final.svg.png" group-title="VTV", VTV1 HD
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="vtv3-hd" tvg-name="VTV3 HD" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/VTV3_logo_2013_final.svg/200px-VTV3_logo_2013_final.svg.png" group-title="VTV", VTV3 HD
https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8

#EXTINF:-1 tvg-id="htv7-hd" tvg-name="HTV7 HD" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/HTV7_logo_2016.svg/200px-HTV7_logo_2016.svg.png" group-title="HTV", HTV7 HD
https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,960x540_1500,1280x720_2000,1920x1080_3000,.mp4.csmil/master.m3u8
`;
