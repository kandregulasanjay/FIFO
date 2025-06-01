require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ordersRouter = require('./routes/FIFO/orders');
const orderAllocationsRouter = require('./routes/FIFO/orderAllocations');
const receiptsRouter = require('./routes/FIFO/receipts');
const receiptAllocation = require('./routes/FIFO/receiptAllocation'); 
const viewRoutes = require('./routes/FIFO/viewRoutes');
const orderStatusRoutes = require('./routes/FIFO/orderStatusRoutes'); 
const transferRoutes = require('./routes/FIFO/transferRoutes');
const holdingRoutes = require('./routes/FIFO/holdingRoutes');
const adjustmentRoutes = require('./routes/FIFO/adjustmentRoutes');
const reserveRoutes = require('./routes/FIFO/reserveRoutes');
const authRoutes = require('./routes/FIFO/authRoutes');
const { authenticateToken, logUserAction } = require('./middleware/auth');
const formRoutes = require('./routes/FORMS/formRoutes');
const reportRoutes = require('./routes/REPORTS/reportRoutes');
const manualPage = require('./routes/MANUAL REPORTS/manualRoutes');
const LeadCaptureRoute = require('./routes/FLEET/LeadCaptureRoute');
const PendingLeadsRoute = require('./routes/FLEET/PendingLeadsRoute');
const QuoteRoute = require('./routes/FLEET/QuoteRoute');
const ExceptionRoute = require('./routes/FIFO/exceptionsRoute');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//FIFO
app.use('/pickslip', authenticateToken, logUserAction, ordersRouter);
app.use('/pickslip-allocations', authenticateToken, logUserAction, orderAllocationsRouter);
app.use('/api', authenticateToken, logUserAction, receiptsRouter);
app.use('/receipt-allocations', authenticateToken, logUserAction, receiptAllocation);
app.use('/api', authenticateToken, logUserAction, viewRoutes);
app.use('/api', authenticateToken, logUserAction, orderStatusRoutes);
app.use('/api', authenticateToken, logUserAction, transferRoutes);
app.use('/api', authenticateToken, logUserAction, holdingRoutes);
app.use('/api', authenticateToken, logUserAction, adjustmentRoutes);
app.use('/api', authenticateToken, logUserAction, reserveRoutes);
app.use('/api', authenticateToken, logUserAction, ExceptionRoute);
app.use('/auth', authRoutes); 

//FORMS
app.use('/api', authenticateToken, logUserAction,formRoutes);
app.use('/api', authenticateToken, logUserAction,reportRoutes);
app.use('/api', authenticateToken, logUserAction,manualPage);

app.use('/api', authenticateToken, logUserAction, LeadCaptureRoute);
app.use('/api', authenticateToken, logUserAction, PendingLeadsRoute);
app.use('/api', authenticateToken, logUserAction, QuoteRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
