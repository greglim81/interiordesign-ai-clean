import { useState } from 'react';
import { StylePreset, STYLE_PRESETS, TransformOptions } from '@/types/transform';
import Image from 'next/image';

interface StyleSelectorProps {
  onOptionsChange: (options: TransformOptions) => void;
  disabled?: boolean;
}

export default function StyleSelector({ onOptionsChange, disabled = false }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('modern');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customNegativePrompt, setCustomNegativePrompt] = useState('');
  const [guidanceScale, setGuidanceScale] = useState(15);
  const [promptStrength, setPromptStrength] = useState(0.8);
  const [numInferenceSteps, setNumInferenceSteps] = useState(50);

  const handleStyleChange = (style: StylePreset) => {
    setSelectedStyle(style);
    const options: TransformOptions = {
      style,
      customPrompt: customPrompt || undefined,
      customNegativePrompt: customNegativePrompt || undefined,
      guidanceScale: guidanceScale !== 15 ? guidanceScale : undefined,
      promptStrength: promptStrength !== 0.8 ? promptStrength : undefined,
      numInferenceSteps: numInferenceSteps !== 50 ? numInferenceSteps : undefined,
    };
    onOptionsChange(options);
  };

  const handleAdvancedChange = () => {
    const options: TransformOptions = {
      style: selectedStyle,
      customPrompt: customPrompt || undefined,
      customNegativePrompt: customNegativePrompt || undefined,
      guidanceScale: guidanceScale !== 15 ? guidanceScale : undefined,
      promptStrength: promptStrength !== 0.8 ? promptStrength : undefined,
      numInferenceSteps: numInferenceSteps !== 50 ? numInferenceSteps : undefined,
    };
    onOptionsChange(options);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.keys(STYLE_PRESETS).map((style) => (
            <button
              key={style}
              onClick={() => handleStyleChange(style as StylePreset)}
              disabled={disabled}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors
                ${selectedStyle === style
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  handleAdvancedChange();
                }}
                disabled={disabled}
                placeholder="Enter a custom prompt to guide the transformation..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Negative Prompt
              </label>
              <textarea
                value={customNegativePrompt}
                onChange={(e) => {
                  setCustomNegativePrompt(e.target.value);
                  handleAdvancedChange();
                }}
                disabled={disabled}
                placeholder="Enter elements to avoid in the transformation..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guidance Scale: {guidanceScale}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={guidanceScale}
                onChange={(e) => {
                  setGuidanceScale(Number(e.target.value));
                  handleAdvancedChange();
                }}
                disabled={disabled}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Strength: {promptStrength}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={promptStrength}
                onChange={(e) => {
                  setPromptStrength(Number(e.target.value));
                  handleAdvancedChange();
                }}
                disabled={disabled}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inference Steps: {numInferenceSteps}
              </label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={numInferenceSteps}
                onChange={(e) => {
                  setNumInferenceSteps(Number(e.target.value));
                  handleAdvancedChange();
                }}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 