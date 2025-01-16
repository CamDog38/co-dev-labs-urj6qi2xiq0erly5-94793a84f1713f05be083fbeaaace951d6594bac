import PreviewContent from './PreviewContent';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Link {
  id: string;
  title: string;
  url: string;
  type: string;
  platform?: string;
  createdAt: string;
}

interface PreviewFrameProps {
  links: Link[];
  bio?: string;
  theme?: string;
}

export default function PreviewFrame({ links, bio, theme }: PreviewFrameProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="relative flex items-center justify-center">
      <div className={`relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] ${isMobile ? 'h-[600px] w-[320px]' : 'h-[800px] w-[380px]'} shadow-xl`}>
        <div className="h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
        <div className={`rounded-[2rem] overflow-hidden ${isMobile ? 'w-[292px] h-[572px]' : 'w-[352px] h-[772px]'} bg-white dark:bg-gray-950`}>
          <div className="w-full h-full overflow-y-auto">
            <PreviewContent links={links} bio={bio} theme={theme} isFrame={true} />
          </div>
        </div>
      </div>
    </div>
  );
}