
const centerModel = require('../models/centerModel');
const studentModel = require('../models/studentModel');
const reservationModel = require('../models/reservationModel');
const studentReservationModel = require('../models/studentReservationModel');

exports.renderNewForm = async (req, res) => {
    try {
        const [centers] = await Promise.all([
            centerModel.getAll()
        ]);
        return res.render('students/new', { centers, flash: null });
    } catch (err) {
        console.error(err);
        return res.status(500).send('خطأ في تحميل النموذج');
    }
};


exports.createStudent = async (req, res) => {
    const { name, phone_number, id_number, date, center_id } = req.body;

    const renderResult = (messageType, message, student, reservation, center) => {
        const available = reservation.capacity - reservation.reserved;
        return res.render('students/result', {
            messageType,
            message,
            student,
            reservation: {
                id: reservation.id,
                date: reservation.date,
                center_id: reservation.center_id,
                center_name: center?.name || '',
                capacity: reservation.capacity,
                reserved: reservation.reserved,
                available
            }
        });
    };

    try {
        if (!name || !phone_number || !id_number || !date || !center_id) {
            throw new Error('جميع الحقول مطلوبة (الاسم، الهاتف، الهوية، التاريخ، المركز).');
        }

        // Ensure reservation exists
        const reservation = await reservationModel.getOrCreate({
            date,
            center_id: Number(center_id)
        });

        // Find or create student
        let student = await studentModel.findByIdNumber(id_number);
        if (!student) {
            student = await studentModel.create({ name, phone_number, id_number });
        }

        // Names for result page
        const [center] = await Promise.all([
            centerModel.getById(reservation.center_id)
        ]);

        // If already linked, show "already exists"
        const existingSR = await studentReservationModel.findByStudentAndReservation({
            student_id: student.id,
            reservation_id: reservation.id
        });
        if (existingSR) {
            return renderResult(
                'warning',
                'الحجز موجود بالفعل لهذا الطالب.',
                student,
                reservation,
                center
            );
        }

        // Create the link (DB triggers enforce capacity and counters)
        await studentReservationModel.create({
            student_id: student.id,
            reservation_id: reservation.id
        });

        // Refetch reservation to get updated reserved number
        const updatedReservation = await reservationModel.findByUnique({
            center_id: reservation.center_id,
            date: reservation.date
        });

        return renderResult(
            'success',
            'تم إنشاء الحجز بنجاح للطالب.',
            student,
            updatedReservation,
            center
        );
    } catch (err) {
        console.error(err);
        // Minimal fallback view (error)
        return res.render('students/result', {
            messageType: 'danger',
            message: err.message || 'فشل في إنشاء الحجز.',
            student: { name, phone_number, id_number },
            reservation: {
                id: '—',
                date: date || '—',
                center_id: Number(center_id) || null,
                center_name: '—',
                capacity: '—',
                reserved: '—',
                available: '—'
            }
        });
    }
};

// GET /students/api/reservations/check?date=YYYY-MM-DD&center_id=..
exports.checkOrCreateReservation = async (req, res) => {
    try {
        const { date, center_id } = req.query;

        if (!date || !center_id) {
            return res.status(400).json({ ok: false, error: 'التاريخ أو معرف المركز مفقود.' });
        }

        const reservation = await reservationModel.getOrCreate({
            date,
            center_id: Number(center_id)
        });

        // Fetch names to include in the response
        const [center] = await Promise.all([
            centerModel.getById(reservation.center_id)
        ]);

        const available = reservation.capacity - reservation.reserved;

        return res.json({
            ok: true,
            reservation: {
                id: reservation.id,
                date: reservation.date,
                center_id: reservation.center_id,
                center_name: center?.name || '',
                capacity: reservation.capacity,
                reserved: reservation.reserved,
                available
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: err.message || 'فشل في التحقق من الحجز أو إنشائه.' });
    }
};

