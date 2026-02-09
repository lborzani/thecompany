import { PathfinderCharacter, EquippedItem } from '@thecompany/shared-types';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { useState } from 'react';
import { abilityModifier } from '../../../utils/pf2e';

interface InventoryTabProps {
  character: PathfinderCharacter;
  onChange: (updated: PathfinderCharacter) => void;
}

export const InventoryTab = ({ character, onChange }: InventoryTabProps) => {
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EquippedItem>>({
    name: '',
    bulk: 0,
    quantity: 1,
    isEquipped: false,
  });

  const strMod = abilityModifier(character.abilityScores.str);
  const maxBulk = 5 + strMod;
  const encumberedAt = maxBulk + 5;

  const currentBulk = character.inventory.reduce((total, item) => {
    return total + (item.bulk * item.quantity);
  }, 0);

  const isEncumbered = currentBulk > maxBulk;

  const addItem = () => {
    if (!newItem.name?.trim()) return;
    const item: EquippedItem = {
      itemId: crypto.randomUUID(),
      name: newItem.name.trim(),
      bulk: newItem.bulk ?? 0,
      quantity: newItem.quantity ?? 1,
      isEquipped: newItem.isEquipped ?? false,
    };
    onChange({ ...character, inventory: [...character.inventory, item] });
    setNewItem({ name: '', bulk: 0, quantity: 1, isEquipped: false });
    setShowAdd(false);
  };

  const removeItem = (itemId: string) => {
    onChange({ ...character, inventory: character.inventory.filter(i => i.itemId !== itemId) });
  };

  const toggleEquipped = (itemId: string) => {
    onChange({
      ...character,
      inventory: character.inventory.map(i =>
        i.itemId === itemId ? { ...i, isEquipped: !i.isEquipped } : i
      ),
    });
  };

  const toggleInvested = (itemId: string) => {
    onChange({
      ...character,
      inventory: character.inventory.map(i =>
        i.itemId === itemId ? { ...i, invested: !i.invested } : i
      ),
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    onChange({
      ...character,
      inventory: character.inventory.map(i =>
        i.itemId === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
      ),
    });
  };

  const filtered = character.inventory.filter(i =>
    i.name.toLowerCase().includes(filter.toLowerCase())
  );

  const equipped = filtered.filter(i => i.isEquipped);
  const unequipped = filtered.filter(i => !i.isEquipped);

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Bulk Tracker */}
      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-zinc-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase">Bulk</span>
          </div>
          <span className={`text-sm font-bold ${isEncumbered ? 'text-red-400' : 'text-zinc-300'}`}>
            {currentBulk} / {maxBulk}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isEncumbered ? 'bg-red-500' : currentBulk > maxBulk * 0.75 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, (currentBulk / encumberedAt) * 100)}%` }}
          />
        </div>
        {isEncumbered && (
          <p className="text-[10px] text-red-400 mt-1">Encumbered! (-10 ft speed, clumsy 1)</p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 text-sm text-white rounded border border-zinc-700"
        />
      </div>

      {/* Equipped Items */}
      {equipped.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Worn & Wielded</h3>
          <div className="space-y-0.5">
            {equipped.map(item => (
              <ItemRow
                key={item.itemId}
                item={item}
                onToggleEquipped={toggleEquipped}
                onToggleInvested={toggleInvested}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unequipped Items */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-1">
          Inventory ({unequipped.length})
        </h3>
        <div className="space-y-0.5">
          {unequipped.map(item => (
            <ItemRow
              key={item.itemId}
              item={item}
              onToggleEquipped={toggleEquipped}
              onToggleInvested={toggleInvested}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>
      </div>

      {character.inventory.length === 0 && !showAdd && (
        <p className="text-sm text-zinc-600 italic text-center py-4">No items</p>
      )}

      {/* Add Item */}
      {showAdd ? (
        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 space-y-2">
          <input
            type="text"
            value={newItem.name || ''}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name"
            className="w-full bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
            autoFocus
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500">Bulk</label>
              <input
                type="number"
                step="0.1"
                value={newItem.bulk ?? 0}
                onChange={(e) => setNewItem({ ...newItem, bulk: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500">Qty</label>
              <input
                type="number"
                value={newItem.quantity ?? 1}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
              Add Item
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-zinc-400 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-400"
        >
          <Plus size={12} /> Add Item
        </button>
      )}
    </div>
  );
};

// ── Item Row Sub-component ─────────────────────────────────

function ItemRow({ item, onToggleEquipped, onToggleInvested, onUpdateQuantity, onRemove }: {
  item: EquippedItem;
  onToggleEquipped: (id: string) => void;
  onToggleInvested?: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-zinc-800 rounded px-2 py-1.5 border border-zinc-700 flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={item.isEquipped}
          onChange={() => onToggleEquipped(item.itemId)}
          className="accent-blue-500"
          title="Equipped"
        />
        <span className="text-sm text-zinc-200 truncate">{item.name}</span>
        {item.bulk > 0 && (
          <span className="text-[10px] text-zinc-500">{item.bulk}B</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {item.invested !== undefined && onToggleInvested && (
          <button
            onClick={() => onToggleInvested(item.itemId)}
            className={`text-[10px] px-1 rounded ${item.invested ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}
            title="Invested"
          >
            INV
          </button>
        )}
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.itemId, parseInt(e.target.value) || 0)}
          className="w-8 text-center text-xs bg-zinc-700 text-zinc-400 rounded border border-zinc-600"
        />
        <button onClick={() => onRemove(item.itemId)} className="text-zinc-600 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
