const checkPaymentTime = (req, res, next) => {
    const now = new Date();
    
    // Get UTC hours and minutes
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // IST is UTC + 5:30
    // Calculate total minutes from start of day in IST
    const istMinutesTotal = (utcHours * 60 + utcMinutes + 330) % (24 * 60);
    
    const istHours = Math.floor(istMinutesTotal / 60);
    const istMinutes = istMinutesTotal % 60;
    
    // Allow payments only between 10:00 AM and 11:00 AM IST
    if (istHours === 10 || (istHours === 11 && istMinutes === 0)) {
        return next();
    }
    
    return res.status(403).json({ 
        message: 'Payments are restricted. You can only initiate or complete payments between 10:00 AM and 11:00 AM IST.' 
    });
};

module.exports = {
    checkPaymentTime
};
