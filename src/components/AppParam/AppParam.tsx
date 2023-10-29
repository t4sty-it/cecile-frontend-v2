export default function AppParam({
  name
}: {
  name?: string
}) {
  return ( 
    <div className="app-param">
      <div className="app-param__name">{name}</div>
    </div>
  )
}