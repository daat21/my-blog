import localFont from 'next/font/local'

export const mapleFonts = localFont({
  src: [
    {
      path: './MapleMonoNormalNL-NF-CN-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './MapleMonoNormalNL-NF-CN-Medium.ttf',
      weight: '500',
      style: 'medium',
    },
    {
      path: './MapleMonoNormalNL-NF-CN-Bold.ttf',
      weight: '700',
      style: 'bold',
    },
    {
      path: './MapleMonoNormalNL-NF-CN-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './MapleMonoNormalNL-NF-CN-MediumItalic.ttf',
      weight: '500',
      style: 'medium italic',
    },
    {
      path: './MapleMonoNormalNL-NF-CN-BoldItalic.ttf',
      weight: '700',
      style: 'bold italic',
    },
  ],
})
