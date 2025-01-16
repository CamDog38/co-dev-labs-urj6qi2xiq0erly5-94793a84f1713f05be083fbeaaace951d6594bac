import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import CalendarWidget from './CalendarWidget';
import { ResultsWidget } from './ResultsWidget';
import { useState } from 'react';
import { useAppearance } from './AppearanceProvider';
import { Button } from './ui/button';
import { Calendar, Facebook, Twitter, Instagram, Youtube, Linkedin, Github, Users, Link as LinkIcon, Video } from 'lucide-react';

interface Link {
  id: string;
  title: string;
  url: string;
  type: string;
  platform?: string;
  order?: number;
  createdAt: string;
}

interface PreviewContentProps {
  links: Link[];
  isFrame?: boolean;
  userId?: string;
  username?: string;
}

const getSocialIcon = (platform?: string) => {
  const { settings } = useAppearance();
  const iconProps = { 
    className: "h-5 w-5",
    color: settings.iconColor
  };
  
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return <Facebook {...iconProps} />;
    case 'twitter':
      return <Twitter {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'youtube':
      return <Youtube {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    case 'github':
      return <Github {...iconProps} />;
    default:
      return <Users {...iconProps} />;
  }
};

const getYouTubeVideoId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get('v') || urlObj.pathname.slice(1);
    }
  } catch (e) {
    console.error('Error parsing video URL:', e);
  }
  return null;
};

export default function PreviewContent({ links, isFrame = false, userId, username }: PreviewContentProps) {
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [activeResultsId, setActiveResultsId] = useState<string | null>(null);
  const { settings } = useAppearance();

  const getButtonStyles = () => {
    const baseStyles = "w-full transition-all duration-200 hover:scale-[1.02]";
    
    // Shape styles
    const shapeStyles = {
      'square': 'rounded-none',
      'round': 'rounded-lg',
      'pill': 'rounded-full'
    };
    const shapeStyle = shapeStyles[settings.buttonShape as keyof typeof shapeStyles] || shapeStyles.square;

    // Shadow styles
    const shadowStyles = {
      'none': '',
      'sm': 'shadow-sm',
      'md': 'shadow-md',
      'lg': 'shadow-lg'
    };
    const shadowStyle = shadowStyles[settings.buttonShadow as keyof typeof shadowStyles] || '';

    return {
      wrapper: cn(baseStyles, "transform-gpu"),
      card: cn(shapeStyle, shadowStyle)
    };
  };

  const renderLink = (link: Link) => {
    if (link.type === 'image') {
      return (
        <Card className="w-full mb-4 overflow-hidden">
          <div 
            className={cn(
              "text-center py-2",
              settings.buttonStyle === 'frosted' && "bg-white/10 backdrop-blur-md border-white/20",
              settings.buttonStyle === 'glass' && "bg-white/5 backdrop-blur-sm border-white/10"
            )}
            style={{
              backgroundColor: settings.buttonStyle === 'default' ? settings.buttonColor : undefined,
              color: settings.buttonStyle === 'default' ? settings.buttonFontColor : 'white',
            }}
          >
            {link.title}
          </div>
          <div className="relative">
            <img
              src={link.url}
              alt={link.title}
              className="w-full h-auto"
            />
          </div>
        </Card>
      );
    }

    if (link.type === 'video') {
      const videoId = getYouTubeVideoId(link.url);
      if (videoId) {
        return (
          <Card className="w-full mb-4 overflow-hidden">
            <div 
              className={cn(
                "text-center py-2",
                settings.buttonStyle === 'frosted' && "bg-white/10 backdrop-blur-md border-white/20",
                settings.buttonStyle === 'glass' && "bg-white/5 backdrop-blur-sm border-white/10"
              )}
              style={{
                backgroundColor: settings.buttonStyle === 'default' ? settings.buttonColor : undefined,
                color: settings.buttonStyle === 'default' ? settings.buttonFontColor : 'white',
              }}
            >
              {link.title}
            </div>
            <div className="relative pb-[56.25%] h-0">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={link.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        );
      }
    }

    if (link.type === 'calendar' || link.type === 'results') {
      const isActive = link.type === 'calendar' ? 
        activeCalendarId === link.id : 
        activeResultsId === link.id;
      
      const styles = getButtonStyles();
      return (
        <div>
          <div 
            className={styles.wrapper}
            onClick={() => {
              if (link.type === 'calendar') {
                setActiveCalendarId(isActive ? null : link.id);
              } else {
                setActiveResultsId(isActive ? null : link.id);
              }
            }}
          >
            <Card 
              className={cn(
                "p-3 cursor-pointer",
                styles.card,
                settings.buttonStyle === 'frosted' && "bg-white/10 backdrop-blur-md border-white/20",
                settings.buttonStyle === 'glass' && "bg-white/5 backdrop-blur-sm border-white/10"
              )}
              style={{
                backgroundColor: settings.buttonStyle === 'default' ? settings.buttonColor : undefined,
                color: settings.buttonStyle === 'default' ? settings.buttonFontColor : 'white',
              }}
            >
              <div className="text-center py-2 flex items-center justify-center gap-2">
                {link.type === 'calendar' ? (
                  <Calendar className="h-4 w-4" />
                ) : (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                )}
                <span>{link.title}</span>
              </div>
            </Card>
          </div>
          
          {isActive && (
            <Card className="mt-2 p-3 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {link.type === 'calendar' ? (
                  <div className="h-[400px]">
                    <CalendarWidget 
                      publicMode={!isFrame}
                      apiEndpoint={!isFrame ? `/api/events/public?username=${username}` : '/api/events'}
                      username={username}
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    <ResultsWidget 
                      userId={userId}
                      username={username}
                      publicMode={!isFrame}
                      apiEndpoint={!isFrame ? `/api/results/public?username=${username}` : undefined}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      );
    }

    if (link.type === 'social') {
      return (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full transition-transform hover:scale-110"
          >
            {getSocialIcon(link.platform)}
          </div>
        </a>
      );
    }

    const styles = getButtonStyles();
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.wrapper}
      >
        <Card 
          className={cn(
            "p-3",
            styles.card,
            settings.buttonStyle === 'frosted' && "bg-white/10 backdrop-blur-md border-white/20",
            settings.buttonStyle === 'glass' && "bg-white/5 backdrop-blur-sm border-white/10"
          )}
          style={{
            backgroundColor: settings.buttonStyle === 'default' ? settings.buttonColor : undefined,
            color: settings.buttonStyle === 'default' ? settings.buttonFontColor : 'white',
          }}
        >
          <div className="text-center py-2 flex items-center justify-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span>{link.title}</span>
          </div>
        </Card>
      </a>
    );
  };

  // Separate social media links from other links
  const socialLinks = links.filter(link => link.type === 'social');
  const otherLinks = links.filter(link => link.type !== 'social');

  return (
    <div 
      className={cn(
        "min-h-screen overflow-y-auto",
        isFrame ? "w-full h-full" : ""
      )}
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.fontColor,
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
      }}
    >
      <div className={cn(
        "mx-auto px-4 py-6 space-y-6",
        !isFrame && "max-w-lg"
      )}>
        {/* Profile Section */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
            {settings.profileImage ? (
              <img 
                src={settings.profileImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTcuOTM5MSAxOS41Nzg2IDE2LjkyMTcgMTguODI4NCAxNi4xNzE2QzE4LjA3ODMgMTUuNDIxNCAxNy4wNjA5IDE1IDE2IDE1SDhDNi45MzkxMyAxNSA1LjkyMTcyIDE1LjQyMTQgNS4xNzE1NyAxNi4xNzE2QzQuNDIxNDMgMTYuOTIxNyA0IDE3LjkzOTEgNCAxOVYyMU0xNiA3QzE2IDkuMjA5MTQgMTQuMjA5MSAxMSAxMiAxMUM5Ljc5MDg2IDExIDggOS4yMDkxNCA4IDdDOCA0Ljc5MDg2IDkuNzkwODYgMyAxMiAzQzE0LjIwOTEgMyAxNiA0Ljc5MDg2IDE2IDdaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';
                }}
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          {settings.bio && <p className="text-sm mb-4">{settings.bio}</p>}
        </div>

        {/* Social Links Section */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {socialLinks.map((link) => (
              <div key={link.id}>
                {renderLink(link)}
              </div>
            ))}
          </div>
        )}

        {/* Other Links Section */}
        <div className="space-y-3">
          {otherLinks.map((link) => (
            <div key={link.id}>
              {renderLink(link)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}