import React from 'react'
import { FormControl, FormField, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Control, FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { authFormSchema } from '@/lib/utils'

const formSchema = authFormSchema('sign-up')

interface DateOfBirthInputProps {
  control: Control<z.infer<typeof formSchema>>,
  name: FieldPath<z.infer<typeof formSchema>>,
  label: string,
}

const DateOfBirthInput = ({ control, name, label }: DateOfBirthInputProps) => {
  // Calculate max date (18 years ago from today)
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const maxDateString = maxDate.toISOString().split('T')[0]

  // Calculate min date (reasonable limit, e.g., 120 years ago)
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Convert YYYY-MM-DD to date input format
        const value = field.value || ''
        
        return (
          <div className="form-item">
            <FormLabel className="form-label">
              {label}
            </FormLabel>
            <div className="flex w-full flex-col">
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  max={maxDateString}
                  min={minDateString}
                  value={value}
                  className="input-class"
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    field.onChange(selectedDate)
                    
                    // Validate age on change
                    if (selectedDate) {
                      const birthDate = new Date(selectedDate)
                      const age = today.getFullYear() - birthDate.getFullYear() - 
                        (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0)
                      
                      if (age < 18) {
                        // Set custom error message
                        field.onBlur()
                      }
                    }
                  }}
                />
              </FormControl>
              <FormMessage className="form-message" />
            </div>
          </div>
        )
      }}
    />
  )
}

export default DateOfBirthInput

