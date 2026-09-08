export const getNumberErrors = (phone : string | null | undefined) => {
    const errors: string[] = [];
    if(!phone) return ["Phone number is required"];
    if(!/^\d{10}$/.test(phone)) {
        errors.push("Phone number must be exactly 10 digits");
    }

    return errors;
};

