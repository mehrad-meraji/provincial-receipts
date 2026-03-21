'use client'

import * as RadixSwitch from '@radix-ui/react-switch'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors outline-none disabled:opacity-50 cursor-pointer ${
        checked ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
      }`}
    >
      <RadixSwitch.Thumb
        className={`block w-4 h-4 bg-white rounded-full shadow transition-transform will-change-transform
          data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]`}
      />
    </RadixSwitch.Root>
  )
}
