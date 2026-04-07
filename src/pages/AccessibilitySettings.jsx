import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Eye, Volume2, Keyboard, RotateCcw } from "lucide-react";

export default function AccessibilitySettings() {
  const [settings, setSettings] = useState({
    fontSizeMode: 'normal',
    highContrast: false,
    dyslexiaFriendlyFont: false,
    screenReaderOptimized: false,
    keyboardNavigationGuide: false,
    textToSpeechEnabled: false,
    focusIndicatorSize: 3,
    colorBlindMode: 'none'
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
    
    // Load accessibility preferences from localStorage
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
      applySettings(JSON.parse(saved));
    }
  }, []);

  const applySettings = (newSettings) => {
    const root = document.documentElement;
    
    // Font size
    root.setAttribute('data-font-size', newSettings.fontSizeMode);
    
    // High contrast
    if (newSettings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Dyslexia font
    if (newSettings.dyslexiaFriendlyFont) {
      document.body.style.fontFamily = "'OpenDyslexic', sans-serif";
    } else {
      document.body.style.fontFamily = 'inherit';
    }
    
    // Focus indicator
    root.style.setProperty('--focus-outline-width', `${newSettings.focusIndicatorSize}px`);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
  };

  const handleReset = () => {
    const defaultSettings = {
      fontSizeMode: 'normal',
      highContrast: false,
      dyslexiaFriendlyFont: false,
      screenReaderOptimized: false,
      keyboardNavigationGuide: false,
      textToSpeechEnabled: false,
      focusIndicatorSize: 3,
      colorBlindMode: 'none'
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.setItem('accessibility_settings', JSON.stringify(defaultSettings));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Accessibility Settings</h1>
          <p className="text-slate-600">Customize your experience to better suit your needs</p>
        </div>

        <div className="space-y-6">
          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Display & Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block">Font Size</label>
                <Select value={settings.fontSizeMode} onValueChange={(val) => handleSettingChange('fontSizeMode', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (14px)</SelectItem>
                    <SelectItem value="normal">Normal (16px)</SelectItem>
                    <SelectItem value="large">Large (18px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">Color Blind Mode</label>
                <Select value={settings.colorBlindMode} onValueChange={(val) => handleSettingChange('colorBlindMode', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="protanopia">Red-Blind (Protanopia)</SelectItem>
                    <SelectItem value="deuteranopia">Green-Blind (Deuteranopia)</SelectItem>
                    <SelectItem value="tritanopia">Blue-Blind (Tritanopia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={settings.highContrast}
                  onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                />
                <label className="text-sm font-semibold">High Contrast Mode</label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={settings.dyslexiaFriendlyFont}
                  onChange={(e) => handleSettingChange('dyslexiaFriendlyFont', e.target.checked)}
                />
                <label className="text-sm font-semibold">Dyslexia-Friendly Font</label>
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">Focus Indicator Size</label>
                <Slider 
                  value={[settings.focusIndicatorSize]}
                  onValueChange={(val) => handleSettingChange('focusIndicatorSize', val[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Audio & Screen Reader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={settings.textToSpeechEnabled}
                  onChange={(e) => handleSettingChange('textToSpeechEnabled', e.target.checked)}
                />
                <label className="text-sm font-semibold">Enable Text-to-Speech</label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={settings.screenReaderOptimized}
                  onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked)}
                />
                <label className="text-sm font-semibold">Optimize for Screen Readers</label>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Navigation & Keyboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={settings.keyboardNavigationGuide}
                  onChange={(e) => handleSettingChange('keyboardNavigationGuide', e.target.checked)}
                />
                <label className="text-sm font-semibold">Show Keyboard Navigation Guide</label>
              </div>
              <p className="text-sm text-slate-600 mt-4">Keyboard Shortcuts:</p>
              <ul className="text-sm space-y-1 text-slate-600">
                <li><kbd>Tab</kbd> - Navigate between elements</li>
                <li><kbd>Shift + Tab</kbd> - Navigate backwards</li>
                <li><kbd>Enter</kbd> - Activate button</li>
                <li><kbd>Space</kbd> - Toggle checkbox</li>
                <li><kbd>Arrow Keys</kbd> - Navigate menus</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}