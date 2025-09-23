import { Button } from "@heroui/button"
import React from "react"

export default function Stepper({ steps = [], activeStep = 0, onStepClick, onStepChangeRequest }) {
  return (
    <div className="flex items-center w-full mb-6">
      {steps.map((label, idx) => {
        const isActive = idx === activeStep
        const isCompleted = idx < activeStep
        return (
          <div key={label} className="flex flex-col items-center relative flex-1">
            <Button
              isIconOnly
              type="button"
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-200 relative z-10
                ${isActive ? 'bg-primary text-white border-primary shadow-lg' : isCompleted ? 'bg-secondary text-white border-secondary' : 'bg-gray-200 text-gray-500 border-gray-300'}`}
              onPress={() => {
                if (onStepChangeRequest) {
                  onStepChangeRequest(idx)
                } else if (onStepClick) {
                  onStepClick(idx)
                }
              }}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? <span>&#10003;</span> : idx + 1}
            </Button>
            <span className={`mt-2 text-xs font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-gray-500'}`}>{label}</span>
            {idx < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-1 ${isCompleted ? 'bg-secondary' : 'bg-gray-300'} z-0`}></div>
            )}
          </div>
        )
      })}
    </div>
  )
}
