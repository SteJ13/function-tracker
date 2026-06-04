/**
 * Utility function to calculate function status based on date and time
 * Status is determined by comparing function datetime with current time
 */

export function getFunctionStatus(functionDate, functionTime) {
    if (!functionDate || !functionTime) {
        return {
            label: 'Completed',
            color: '#4CAF50', // green
        };
    }

    try {
        // Parse date and time into a Date object
        const functionDateTime = new Date(`${functionDate}T${functionTime}:00`);

        if (isNaN(functionDateTime.getTime())) {
            console.warn('[getFunctionStatus] Invalid date/time:', functionDate, functionTime);
            return {
                label: 'Completed',
                color: '#4CAF50',
            };
        }

        const now = new Date();

        // If function datetime is in the future, it's upcoming
        if (functionDateTime > now) {
            return {
                label: 'Upcoming',
                color: '#1976D2', // blue
            };
        }

        // Otherwise, it's completed
        return {
            label: 'Completed',
            color: '#4CAF50', // green
        };
    } catch (error) {
        console.error('[getFunctionStatus] Error calculating status:', error);
        return {
            label: 'Completed',
            color: '#4CAF50',
        };
    }
}

/**
 * Sort functions by status and date
 * Upcoming functions first (ascending), then completed (descending)
 */
export function sortFunctionsByStatus(functions) {
    const upcoming = [];
    const completed = [];

    functions.forEach(fn => {
        const status = getFunctionStatus(fn.function_date, fn.function_time);
        if (status.label === 'Upcoming') {
            upcoming.push(fn);
        } else {
            completed.push(fn);
        }
    });

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => {
        const dateA = new Date(`${a.function_date}T${a.function_time}:00`);
        const dateB = new Date(`${b.function_date}T${b.function_time}:00`);
        return dateA - dateB;
    });

    // Sort completed by date descending
    completed.sort((a, b) => {
        const dateA = new Date(`${a.function_date}T${a.function_time}:00`);
        const dateB = new Date(`${b.function_date}T${b.function_time}:00`);
        return dateB - dateA;
    });

    return [...upcoming, ...completed];
}
