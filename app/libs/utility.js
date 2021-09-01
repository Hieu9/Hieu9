exports.isJSON = (string) => {
    if (typeof string === 'string') {
        try {
            const o = JSON.parse(string)
            if (o && typeof o === 'object') {
                return true
            } if (o && Array.isArray(o)) {
                return true
            }
        } catch (e) {
            return false
        }
    } else if (typeof string === 'object' || Array.isArray(string)) {
        return true
    } else {
        return false
    }
    return false
}

exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}