import React from 'react'

function MainContentLayoutProvider({children}) {
  return (
   <div className="w-full h-screen overflow-hidden">
      {children}
   </div>
  )
}

export default MainContentLayoutProvider