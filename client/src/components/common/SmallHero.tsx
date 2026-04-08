interface SmallHeroProps {
  pageTitle: string;
}

export function SmallHero({ pageTitle }: SmallHeroProps) {
  return (
    <div 
      className="h-full p-14 bg-cover bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url(/meyerwatercolor.png)', 
        backgroundSize: 'cover', 
        backgroundPosition: '25% 25%' 
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="w-full h-full">
        <div className="flex justify-center items-center text-center relative">
          <div className="text-white font-khula relative">
            <h1 className="text-4xl font-bold">{pageTitle}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
