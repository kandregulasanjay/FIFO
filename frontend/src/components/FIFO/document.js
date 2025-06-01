import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  List,
  ListItem,
  Link,
  Divider,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled, useTheme } from "@mui/material/styles";

const ImagePlaceholder = styled(Box)(({ theme }) => ({
  width: "100%",
  height: 320, // or your preferred height
  background: "repeating-linear-gradient(45deg,#ccc,#ccc 10px,#eee 10px,#eee 20px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: theme.spacing(2, 0),
  borderRadius: 8,
  color: "#666",
  fontStyle: "italic",
  fontSize: "1em",
  padding: 0, // Ensure no padding
}));

const sections = [
  {
    id: "receipts",
    en: {
      title: "1. Receipts",
      content: (
        <>
          <Typography paragraph>
            The <strong>Goods Receipt Note (GRN)</strong> process is a fundamental part of inventory management and involves tracking goods received at the warehouse. Once products are received, they are synchronized between the <strong>Titan</strong> system and the <strong>New Bin Allocation System</strong>. The synchronization ensures that all received items are registered and ready for processing within the system. Any pending receipts are displayed in the system, allowing warehouse staff to allocate them to the appropriate storage bins for proper organization.
          </Typography>
          <Typography paragraph>
            There are two primary methods of processing receipts:
          </Typography>
          <ol>
            <li>
              <strong>Direct Allocation to Bins:</strong> In this method, once the goods are received and verified, they are directly allocated to bins. The goods are immediately available for customer orders, ensuring that inventory is quickly ready for order fulfillment.
            </li>
            <li>
              <strong>Reserved Receipts:</strong> Some receipts are reserved for customer-specific orders or inspection purposes. This ensures that stock is not prematurely allocated, especially when the goods are not yet ready for customer orders.
            </li>
          </ol>
          <ImagePlaceholder>Image: GRN System Interface</ImagePlaceholder>
        </>
      ),
    },
    ar: {
      title: "1. الاستلامات",
      content: (
        <>
          <Typography paragraph>
            <strong>إشعار استلام البضائع (GRN)</strong> هو جزء أساسي من إدارة المخزون ويتضمن تتبع البضائع المستلمة في المستودع. بمجرد استلام المنتجات، يتم مزامنتها بين نظام <strong>تيتان</strong> ونظام <strong>تخصيص الصناديق الجديد</strong>. تضمن هذه المزامنة تسجيل جميع العناصر المستلمة وجاهزيتها للمعالجة في النظام.
          </Typography>
          <Typography paragraph>
            هناك طريقتان رئيسيتان لمعالجة الاستلامات:
          </Typography>
          <ol>
            <li>
              <strong>التخصيص المباشر إلى الصناديق:</strong> في هذه الطريقة، بمجرد استلام البضائع والتحقق منها، يتم تخصيصها مباشرة إلى الصناديق. تكون البضائع متاحة على الفور للطلبات العملاء.
            </li>
            <li>
              <strong>الاستلامات المحجوزة:</strong> يتم حجز بعض الاستلامات من أجل الطلبات الخاصة بالعملاء أو لأغراض الفحص. يتم ضمان عدم تخصيص هذه البضائع قبل أن تصبح جاهزة للطلبات.
            </li>
          </ol>
          <ImagePlaceholder>صورة: واجهة نظام GRN</ImagePlaceholder>
        </>
      ),
    },
  },
  {
    id: "pickslip",
    en: {
      title: "2. Pickslip",
      content: (
        <>
          <Typography paragraph>
            The <strong>Pickslip</strong> process is critical in fulfilling customer orders, and it is integrated with both the <strong>Titan</strong> and <strong>New Bin Allocation System</strong> to streamline order picking. Pickslips are essentially documents or system-generated instructions that guide warehouse staff on which items to pick and from which bins. This ensures that the correct products are retrieved from inventory to fulfill customer orders accurately and efficiently.
          </Typography>
          <Typography paragraph>
            There are two main options when handling pickslips:
          </Typography>
          <ol>
            <li>
              <strong>Customer Order Fulfillment:</strong> This option involves creating a pickslip for a specific customer order. The warehouse staff picks the items requested by the customer, ensuring accuracy in fulfilling the order.
            </li>
            <li>
              <strong>Hold Orders Within the Organization:</strong> Some orders are held in the warehouse before being released to the customer. This could be due to various reasons like special packaging requirements or partial order fulfillment.
            </li>
          </ol>
          <ImagePlaceholder>
            <img
              src="/images/pickslip.jpg"
              alt="Pickslip System Interface"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
                display: "block",
              }}
            />
          </ImagePlaceholder>
        </>
      ),
    },
    ar: {
      title: "2. إشعار الانتقاء",
      content: (
        <>
          <Typography paragraph>
            <strong>إشعار الانتقاء</strong> هو جزء أساسي في تنفيذ طلبات العملاء، ويتم دمجه مع كل من نظام <strong>تيتان</strong> ونظام <strong>تخصيص الصناديق الجديد</strong> لتسهيل عملية الانتقاء. يوفر إشعار الانتقاء التعليمات لفريق العمل في المستودع بشأن العناصر التي يجب انتقاؤها وأي صناديق يجب استخدامها.
          </Typography>
          <Typography paragraph>
            هناك خياران رئيسيان عند التعامل مع إشعارات الانتقاء:
          </Typography>
          <ol>
            <li>
              <strong>تنفيذ طلب العميل:</strong> يتضمن هذا الخيار إنشاء إشعار انتقاء لطلب معين من العميل. يقوم فريق العمل في المستودع باختيار العناصر المطلوبة من قبل العميل.
            </li>
            <li>
              <strong>الاحتفاظ بالطلبات داخل المنظمة:</strong> بعض الطلبات يتم الاحتفاظ بها داخل المنظمة قبل أن يتم إرسالها للعملاء لأسباب معينة.
            </li>
          </ol>
          <ImagePlaceholder>صورة: واجهة نظام إشعار الانتقاء</ImagePlaceholder>
        </>
      ),
    },
  },
  {
    id: "transfers",
    en: {
      title: "3. Transfers",
      content: (
        <>
          <Typography paragraph>
            The <strong>Transfer</strong> process helps move stock from one bin location to another. This allows for flexibility in managing inventory and optimizing space within the warehouse. Transferring stock in partial quantities is especially useful when only part of the stock is required in another section, preventing unnecessary stock movements.
          </Typography>
          <ImagePlaceholder>Image: Transfer System Interface</ImagePlaceholder>
        </>
      ),
    },
    ar: {
      title: "3. التحويلات",
      content: (
        <>
          <Typography paragraph>
            يساعد عملية <strong>التحويل</strong> في نقل المخزون من مكان إلى آخر ضمن المستودع. هذا يوفر مرونة في إدارة المخزون وتحسين المساحة داخل المستودع. يمكن تحويل المخزون بكميات جزئية، مما يسمح بتقليل الحركة غير الضرورية للبضائع.
          </Typography>
          <ImagePlaceholder>صورة: واجهة نظام التحويلات</ImagePlaceholder>
        </>
      ),
    },
  },
  {
    id: "holding",
    en: {
      title: "4. Holding",
      content: (
        <>
          <Typography paragraph>
            The <strong>Holding</strong> process refers to the management of customer-invoiced stock that has been processed but not yet shipped. The goods may be held in full or partial quantities depending on the customer’s needs. This ensures that customer orders can be fulfilled efficiently while maintaining stock control.
          </Typography>
          <ImagePlaceholder>Image: Holding Process Interface</ImagePlaceholder>
        </>
      ),
    },
    ar: {
      title: "4. الحجز",
      content: (
        <>
          <Typography paragraph>
            يشير <strong>الحجز</strong> إلى إدارة المخزون الذي تم فوترته للعملاء ولكنه لم يتم شحنه بعد. يمكن حجز البضائع بالكامل أو جزئياً حسب احتياجات العميل. يتم ضمان أنه يمكن الوفاء بالطلبات للعملاء بكفاءة بينما يتم الحفاظ على مراقبة المخزون.
          </Typography>
          <ImagePlaceholder>صورة: واجهة عملية الحجز</ImagePlaceholder>
        </>
      ),
    },
  },
];

const Footer = styled(Box)(({ theme }) => ({
  textAlign: "center",
  fontSize: "0.9em",
  color: "#999",
  padding: theme.spacing(5, 2),
  borderTop: "1px solid #ddd",
  marginTop: theme.spacing(6),
}));

const DocHeader = styled(Box)(({ theme }) => ({
  background: "linear-gradient(to right, #003366, #0059b3)",
  color: "white",
  padding: theme.spacing(7, 2),
  textAlign: "center",
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
}));

const TableOfContents = ({ lang, onNavigate }) => (
  <Paper elevation={2} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ borderBottom: "2px solid #0059b3", pb: 1, mb: 2 }}>
      {lang === "en" ? "Table of Contents" : "فهرس المحتويات"}
    </Typography>
    <List>
      {sections.map((section) => (
        <ListItem key={section.id} sx={{ pl: 0 }}>
          <Link
            href={`#${section.id}`}
            underline="hover"
            color="primary"
            fontWeight={600}
            fontSize="1.05em"
            onClick={e => {
              e.preventDefault();
              onNavigate(section.id);
            }}
          >
            {section[lang].title}
          </Link>
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default function Document() {
  const [lang, setLang] = useState("en");
  const [search, setSearch] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Filter sections by search
  const filteredSections = sections.filter(section => {
    const text =
      section[lang].title +
      " " +
      (typeof section[lang].content === "string"
        ? section[lang].content
        : "");
    return text.toLowerCase().includes(search.toLowerCase());
  });

  // Scroll to section
  const handleNavigate = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // RTL for Arabic
  const isArabic = lang === "ar";

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        minHeight: "100vh",
        direction: isArabic ? "rtl" : "ltr",
        fontFamily: isArabic ? "Tahoma, sans-serif" : "'Inter', sans-serif",
        width: "100vw", // Ensure full viewport width
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
      }}
    >
      <Container
        maxWidth={false} // Make container full width
        disableGutters // Remove default padding
        sx={{ pt: isMobile ? 2 : 4, px: 0, width: "100vw" }}
      >
        {/* Language Toggle */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Button
            variant={lang === "en" ? "contained" : "outlined"}
            onClick={() => setLang("en")}
            sx={{ mx: 1 }}
          >
            English
          </Button>
          <Button
            variant={lang === "ar" ? "contained" : "outlined"}
            onClick={() => setLang("ar")}
            sx={{ mx: 1 }}
          >
            العربية
          </Button>
        </Box>

        {/* Header */}
        <DocHeader>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>
            {lang === "en"
              ? "Warehouse Operations Help Documentation"
              : "وثائق مساعدة لعمليات المستودع"}
          </Typography>
        </DocHeader>

        {/* Table of Contents */}
        <TableOfContents lang={lang} onNavigate={handleNavigate} />

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={
              lang === "en"
                ? "🔍 Search sections..."
                : "🔍 ابحث في الأقسام..."
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
        </Box>

        {/* Sections */}
        {filteredSections.length === 0 && (
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {lang === "en" ? "No results found." : "لا توجد نتائج."}
          </Typography>
        )}
        {filteredSections.map(section => (
          <Box id={section.id} key={section.id} className="searchable" sx={{ mb: 4 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={700} color="#003366">
                  {section[lang].title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>{section[lang].content}</AccordionDetails>
            </Accordion>
          </Box>
        ))}

        {/* Footer */}
        <Footer>
          &copy; 2025 {lang === "en" ? "AL ABTATIN – Internal Use Only." : "اسم شركتك – للاستخدام الداخلي فقط."}
        </Footer>
      </Container>
    </Box>
  );
}