import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface Patient {
  _id: string;
  id: string;
  name: string;
  createdByUser: string;
  createdAt: string;
}

interface Order {
  _id?: string;
  message: string;
  updatedAt?: string;
}

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newOrder, setNewOrder] = useState("");

  // 確認儲存 Order Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToSave, setOrderToSave] = useState<Order | null>(null);
  const [isNewOrder, setIsNewOrder] = useState(false); // 判斷新增或編輯

  // 取得患者列表
  useEffect(() => {
    const getPatients = async () => {
      try {
        const response = await axios.get("http://localhost:5000/patient/list");
        setPatients(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getPatients();
  }, []);

  // 點擊患者 → 取得 Orders
  const handlePatientClick = async (patient: Patient) => {
    setSelectedPatient(patient);
    setOrders([]);
    setDialogOpen(true);
    setOrderLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/patient/${patient._id}`
      );
      setOrders(response.data.data.orders);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setOrderLoading(false);
    }
  };

  // 編輯 Order (先修改 local state)
  const handleOrderChange = (id: string, value: string) => {
    setOrders(orders.map((o) => (o._id === id ? { ...o, message: value } : o)));
  };

  // 點擊編輯儲存 → 開啟確認對話框
  const handleConfirmEditOrder = (order: Order) => {
    setOrderToSave(order);
    setIsNewOrder(false);
    setConfirmDialogOpen(true);
  };

  // 點擊新增 Order → 開啟確認對話框
  const handleConfirmAddOrder = () => {
    if (!newOrder.trim()) return;
    setOrderToSave({ message: newOrder });
    setIsNewOrder(true);
    setConfirmDialogOpen(true);
  };

  // 確認儲存 Order
  const handleSaveOrder = async () => {
    if (!orderToSave || !selectedPatient) return;

    try {
      if (isNewOrder) {
        // 新增 Order
        const response = await axios.post(`http://localhost:5000/patient/`, {
          patientId: selectedPatient.id,
          message: orderToSave.message,
          createdByUser: "louis",
          updatedByUser: "louis",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // response.data 可能是 { success: true, data: null }，因此直接用 orderToSave 或從 response.data.data 取
        const newOrderFromServer = response.data.data || orderToSave;
        setOrders([...orders, newOrderFromServer]);
        setNewOrder("");
      } else {
        // 編輯 Order
        await axios.patch(`http://localhost:5000/patient/${orderToSave._id}`, {
          message: orderToSave.message,
          updatedByUser: "AAA",
          updatedAt: new Date(),
        });
        setOrders(
          orders.map((o) =>
            o._id === orderToSave._id
              ? { ...o, message: orderToSave.message }
              : o
          )
        );
        alert("Order updated");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDialogOpen(false);
      setOrderToSave(null);
      setIsNewOrder(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Patients List
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {patients.map((patient) => (
            <ListItemButton
              key={patient._id}
              component="div"
              onClick={() => handlePatientClick(patient)}
              style={{ cursor: "pointer" }}
            >
              <ListItemText
                primary={patient.name}
                secondary={`Created By: ${
                  patient.createdByUser
                } | Created At: ${new Date(
                  patient.createdAt
                ).toLocaleString()}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {/* Dialog for Orders */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedPatient?.name} - 醫囑
          <IconButton
            style={{ float: "right" }}
            onClick={handleConfirmAddOrder}
            size="large"
          >
            <AddIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {orderLoading ? (
            <CircularProgress />
          ) : (
            <List>
              {orders.map((order) => (
                <ListItemButton key={order._id}>
                  <TextField
                    fullWidth
                    value={order.message}
                    onChange={(e) =>
                      handleOrderChange(order._id!, e.target.value)
                    }
                    onBlur={() => handleConfirmEditOrder(order)}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
          <TextField
            fullWidth
            label="New Order"
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            style={{ marginTop: "1rem" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 確認儲存對話框 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>確認儲存 Order？</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveOrder} variant="contained" color="primary">
            確認
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
