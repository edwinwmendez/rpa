// Note Action Form - Formulario completo para configurar notas/comentarios
import { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { Button } from '../../ui/button';

export interface NoteConfig {
  label: string;
  content: string;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'pink';
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

interface NoteActionFormProps {
  config: NoteConfig;
  onChange: (config: Partial<NoteConfig>) => void;
}

export function NoteActionForm({ config, onChange }: NoteActionFormProps) {
  const [label, setLabel] = useState(config.label || 'Nota');
  const [content, setContent] = useState(config.content || '');
  const [color, setColor] = useState<'yellow' | 'blue' | 'green' | 'purple' | 'pink'>(config.color || 'yellow');
  const [width, setWidth] = useState(config.width || 250);
  const [height, setHeight] = useState(config.height || 150);
  const [fontSize, setFontSize] = useState(config.fontSize || 14);
  const [fontFamily, setFontFamily] = useState(config.fontFamily || 'system');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold' | '600' | '700'>(config.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(config.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>(config.textDecoration || 'none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>(config.textAlign || 'left');
  const [lineHeight, setLineHeight] = useState(config.lineHeight || 1.5);

  // Sincronizar con cambios externos
  useEffect(() => {
    setLabel(config.label || 'Nota');
    setContent(config.content || '');
    setColor(config.color || 'yellow');
    setWidth(config.width || 250);
    setHeight(config.height || 150);
    setFontSize(config.fontSize || 14);
    setFontFamily(config.fontFamily || 'system');
    setFontWeight(config.fontWeight || 'normal');
    setFontStyle(config.fontStyle || 'normal');
    setTextDecoration(config.textDecoration || 'none');
    setTextAlign(config.textAlign || 'left');
    setLineHeight(config.lineHeight || 1.5);
  }, [config]);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onChange({ label: newLabel });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange({ content: newContent });
  };

  const handleColorChange = (newColor: 'yellow' | 'blue' | 'green' | 'purple' | 'pink') => {
    setColor(newColor);
    onChange({ color: newColor });
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    onChange({ width: newWidth });
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    onChange({ height: newHeight });
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onChange({ fontSize: newSize });
  };

  const handleFontFamilyChange = (newFamily: string) => {
    setFontFamily(newFamily);
    onChange({ fontFamily: newFamily });
  };

  const toggleBold = () => {
    const newWeight = fontWeight === 'bold' || fontWeight === '700' ? 'normal' : 'bold';
    setFontWeight(newWeight);
    onChange({ fontWeight: newWeight });
  };

  const toggleItalic = () => {
    const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
    setFontStyle(newStyle);
    onChange({ fontStyle: newStyle });
  };

  const toggleUnderline = () => {
    const newDecoration = textDecoration === 'underline' ? 'none' : 'underline';
    setTextDecoration(newDecoration);
    onChange({ textDecoration: newDecoration });
  };

  const handleTextAlignChange = (newAlign: 'left' | 'center' | 'right' | 'justify') => {
    setTextAlign(newAlign);
    onChange({ textAlign: newAlign });
  };

  const handleLineHeightChange = (newHeight: number) => {
    setLineHeight(newHeight);
    onChange({ lineHeight: newHeight });
  };

  return (
    <div className="space-y-4">
      {/* Título de la nota */}
      <div className="space-y-2">
        <Label htmlFor="note-label">Título de la nota</Label>
        <Input
          id="note-label"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Mi Nota"
        />
      </div>

      {/* Contenido */}
      <div className="space-y-2">
        <Label htmlFor="note-content">Contenido</Label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-32 p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          placeholder="Escribe el contenido de la nota aquí..."
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="note-color">Color de fondo</Label>
        <Select value={color} onValueChange={handleColorChange}>
          <SelectTrigger id="note-color">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yellow">Amarillo</SelectItem>
            <SelectItem value="blue">Azul</SelectItem>
            <SelectItem value="green">Verde</SelectItem>
            <SelectItem value="purple">Morado</SelectItem>
            <SelectItem value="pink">Rosa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tamaño */}
      <div className="space-y-3">
        <Label>Tamaño de la nota</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="note-width" className="text-xs text-gray-600">
              Ancho (px)
            </Label>
            <Input
              id="note-width"
              type="number"
              min="150"
              max="600"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-height" className="text-xs text-gray-600">
              Alto (px)
            </Label>
            <Input
              id="note-height"
              type="number"
              min="100"
              max="500"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Tipografía */}
      <div className="space-y-3">
        <Label>Tipografía</Label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="note-font-size" className="text-xs text-gray-600">
                Tamaño de fuente (px)
              </Label>
              <Input
                id="note-font-size"
                type="number"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-font-family" className="text-xs text-gray-600">
                Fuente
              </Label>
              <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                <SelectTrigger id="note-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-line-height" className="text-xs text-gray-600">
              Altura de línea
            </Label>
            <Input
              id="note-line-height"
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={(e) => handleLineHeightChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Estilos de texto */}
      <div className="space-y-2">
        <Label>Estilos de texto</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={fontWeight === 'bold' || fontWeight === '700' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleBold}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleItalic}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={textDecoration === 'underline' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleUnderline}
            title="Subrayado"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alineación de texto */}
      <div className="space-y-2">
        <Label>Alineación de texto</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTextAlignChange('left')}
            title="Izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={textAlign === 'center' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTextAlignChange('center')}
            title="Centro"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={textAlign === 'right' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTextAlignChange('right')}
            title="Derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={textAlign === 'justify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTextAlignChange('justify')}
            title="Justificado"
            className="flex-1"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

