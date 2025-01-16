import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppearance } from './AppearanceProvider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AppearanceSettingsType {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonFontColor: string;
  buttonShape: string;
  buttonStyle: string;
  buttonShadow: string;
  iconColor: string;
  resultsView: 'accordion' | 'timeline';
}

const eventTypes = [
  { value: 'default', label: 'Default Events' },
  { value: 'race', label: 'Race Events' },
  { value: 'training', label: 'Training Events' },
  { value: 'social', label: 'Social Events' },
  { value: 'other', label: 'Other Events' },
];

const fontFamilies = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Roboto',
];

const buttonShapes = [
  { 
    value: 'square', 
    label: 'Square',
    preview: 'rounded-none'
  },
  { 
    value: 'round', 
    label: 'Round',
    preview: 'rounded-xl'
  },
  { 
    value: 'pill', 
    label: 'Pill',
    preview: 'rounded-full'
  },
];

const buttonStyles = [
  {
    value: 'default',
    label: 'Default',
    variant: 'default',
  },
  {
    value: 'frosted',
    label: 'Frosted Glass',
    variant: 'frosted',
  },
  {
    value: 'glass',
    label: 'Glass',
    variant: 'glass',
  },
];

const buttonShadows = [
  {
    value: 'none',
    label: 'No Shadow',
    shadow: 'none',
  },
  {
    value: 'sm',
    label: 'Small Shadow',
    shadow: 'sm',
  },
  {
    value: 'md',
    label: 'Medium Shadow',
    shadow: 'md',
  },
  {
    value: 'lg',
    label: 'Large Shadow',
    shadow: 'lg',
  },
];

const ButtonPreview = ({ 
  shape, 
  color, 
  textColor,
  variant = 'default',
  shadow = 'none'
}: { 
  shape: string; 
  color: string; 
  textColor: string;
  variant?: string;
  shadow?: string;
}) => {
  const shapeStyle = buttonShapes.find(s => s.value === shape)?.preview || 'rounded-none';
  
  return (
    <Button
      variant={variant as any}
      shape={shape as any}
      shadow={shadow as any}
      className="w-full"
      style={{
        backgroundColor: variant === 'default' ? color : undefined,
        color: variant === 'default' ? textColor : undefined,
      }}
    >
      Preview Button
    </Button>
  );
};

export default function AppearanceSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useAppearance();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await fetch('/api/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      toast({
        title: 'Success',
        description: 'Appearance settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update appearance settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: keyof AppearanceSettingsType, value: string | number) => {
    const newSettings = { ...settings, [field]: value };
    updateSettings(newSettings);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {/* Typography Section */}
          <AccordionItem value="typography">
            <AccordionTrigger>Typography</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(value) => handleChange('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fontSize">Font Size (px)</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={settings.fontSize}
                    onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                    min={12}
                    max={24}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fontColor">Font Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fontColor"
                      type="color"
                      value={settings.fontColor}
                      onChange={(e) => handleChange('fontColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.fontColor}
                      onChange={(e) => handleChange('fontColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Colors Section */}
          <AccordionItem value="colors">
            <AccordionTrigger>Colors</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="iconColor">Icon Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="iconColor"
                      type="color"
                      value={settings.iconColor}
                      onChange={(e) => handleChange('iconColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.iconColor}
                      onChange={(e) => handleChange('iconColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Buttons Section */}
          <AccordionItem value="buttons">
            <AccordionTrigger>Buttons</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <Tabs defaultValue="shape" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="shape">Shape</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="shadow">Shadow</TabsTrigger>
                  </TabsList>
                  <TabsContent value="shape" className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {buttonShapes.map((shape) => (
                        <div 
                          key={shape.value}
                          className={`p-4 border rounded-lg cursor-pointer ${
                            settings.buttonShape === shape.value ? 'border-primary' : 'border-border'
                          }`}
                          onClick={() => handleChange('buttonShape', shape.value)}
                        >
                          <p className="mb-2 text-sm font-medium">{shape.label}</p>
                          <ButtonPreview 
                            shape={shape.value} 
                            color={settings.buttonColor} 
                            textColor={settings.buttonFontColor} 
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="style" className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {buttonStyles.map((style) => (
                        <div 
                          key={style.value}
                          className={`p-4 border rounded-lg cursor-pointer ${
                            settings.buttonStyle === style.value ? 'border-primary' : 'border-border'
                          }`}
                          onClick={() => handleChange('buttonStyle', style.value)}
                        >
                          <p className="mb-2 text-sm font-medium">{style.label}</p>
                          <ButtonPreview 
                            shape={settings.buttonShape}
                            color={settings.buttonColor} 
                            textColor={settings.buttonFontColor}
                            variant={style.variant}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="shadow" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {buttonShadows.map((shadow) => (
                        <div 
                          key={shadow.value}
                          className={`p-4 border rounded-lg cursor-pointer ${
                            settings.buttonShadow === shadow.value ? 'border-primary' : 'border-border'
                          }`}
                          onClick={() => handleChange('buttonShadow', shadow.value)}
                        >
                          <p className="mb-2 text-sm font-medium">{shadow.label}</p>
                          <ButtonPreview 
                            shape={settings.buttonShape}
                            color={settings.buttonColor} 
                            textColor={settings.buttonFontColor}
                            shadow={shadow.shadow}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid gap-2">
                  <Label htmlFor="buttonColor">Button Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="buttonColor"
                      type="color"
                      value={settings.buttonColor}
                      onChange={(e) => handleChange('buttonColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.buttonColor}
                      onChange={(e) => handleChange('buttonColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="buttonFontColor">Button Font Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="buttonFontColor"
                      type="color"
                      value={settings.buttonFontColor}
                      onChange={(e) => handleChange('buttonFontColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.buttonFontColor}
                      onChange={(e) => handleChange('buttonFontColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Results Section */}
          <AccordionItem value="results">
            <AccordionTrigger>Results</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-2">
                <Label htmlFor="resultsView">Results View Style</Label>
                <Select
                  value={settings.resultsView || 'accordion'}
                  onValueChange={(value) => handleChange('resultsView', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select results view style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accordion">Accordion View</SelectItem>
                    <SelectItem value="timeline">Timeline View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Events Section */}
          <AccordionItem value="events">
            <AccordionTrigger>Event Colors</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                {eventTypes.map((type) => (
                  <div key={type.value} className="flex items-center gap-4">
                    <Label htmlFor={`eventColor-${type.value}`} className="w-32">{type.label}</Label>
                    <div className="flex gap-2 flex-1">
                      <Input
                        id={`eventColor-${type.value}`}
                        type="color"
                        value={settings.eventColors?.[type.value] || '#2563eb'}
                        onChange={(e) => {
                          const newEventColors = {
                            ...settings.eventColors,
                            [type.value]: e.target.value
                          };
                          updateSettings({
                            ...settings,
                            eventColors: newEventColors
                          });
                        }}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.eventColors?.[type.value] || '#2563eb'}
                        onChange={(e) => {
                          const newEventColors = {
                            ...settings.eventColors,
                            [type.value]: e.target.value
                          };
                          updateSettings({
                            ...settings,
                            eventColors: newEventColors
                          });
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={handleSave} className="mt-6 w-full">Save Appearance</Button>
      </CardContent>
    </Card>
  );
}