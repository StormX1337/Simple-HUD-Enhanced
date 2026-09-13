import { BuildingArt } from './components/art/BuildingArt';
import type { BuildingKind } from './types';

const KINDS: BuildingKind[] = ['hut', 'dock', 'mill', 'tower', 'statue', 'market', 'forge', 'lighthouse'];

/** Nur für die Entwicklung: alle Gebäude in allen Stufen nebeneinander. */
export function DevGallery(): JSX.Element {
  return (
    <div className="min-h-screen bg-[#2f6f9e] p-3">
      {KINDS.map((kind) => (
        <div key={kind} className="mb-2 flex items-end gap-1">
          <span className="w-20 font-display text-sm font-black text-white">{kind}</span>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <BuildingArt key={level} kind={kind} level={level} accent="#e0533c" size={96} />
          ))}
        </div>
      ))}
    </div>
  );
}
