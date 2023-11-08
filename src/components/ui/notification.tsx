import MuiAlert, { AlertProps } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface NotificationProps {
  open: boolean;
  message: string;
  severity: "success" | "error";
  onClose: () => void;
}

function Notification(props: NotificationProps) {
  const { open, message, severity, onClose } = props;

  if (!open) {
    return null;
  }

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <div>
        <Alert onClose={onClose} severity={severity}>
          {message}
        </Alert>
      </div>
    </Snackbar>
  );
}

export default Notification;
