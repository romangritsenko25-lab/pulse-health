import dynamic from 'next/dynamic'

const CabinetClient = dynamic(() => import('./CabinetClient'), { ssr: false })

export default function CabinetPage() {
  return <CabinetClient />
}
