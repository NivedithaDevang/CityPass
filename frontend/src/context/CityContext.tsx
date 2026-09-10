import { createContext, useContext, useState, type ReactNode } from "react";

export const ALL_LOCATIONS = "All locations";

interface CityContextType {
    selectedCity: string;
    setSelectedCity: (city: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider ({ children }: {children: ReactNode}){
    const [selectedCity, setSelectedCity] = useState<string>(ALL_LOCATIONS);

    return (
        <CityContext.Provider value = {{ selectedCity, setSelectedCity }}>
            { children }
        </CityContext.Provider>
    );
}

export function useCity() {
    const context = useContext(CityContext);

    if (!context){
        throw new Error("useCity must be used within a City Provider");
    }
    return context;
}