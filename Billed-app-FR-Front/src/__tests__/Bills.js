/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import '@testing-library/jest-dom';
import billsClick from '../containers/Bills.js'
import userEvent from '@testing-library/user-event';


import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)



describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const windowIcon = screen.getByTestId('icon-window') 
      await waitFor(() => windowIcon)
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => (a.date < b.date) ? 1 : -1) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Should be in newBIll when I cick on icon newBill", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const bill = new billsClick({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: { bills } })
      const handleClickNewBill = jest.fn(() => bill.handleClickNewBill())
      const iconNewBill = screen.getByTestId('btn-new-bill')
      iconNewBill.addEventListener('click', handleClickNewBill)
      userEvent.click(iconNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    test("Modal Should open when I click on eye icon", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee"
    }))
    const billsInit = new billsClick({
      document, onNavigate, store: null, localStorage: window.localStorage
    })
    document.body.innerHTML = BillsUI({ data: bills })
    const handleClickIconEye = jest.fn((icon) => billsInit.handleClickIconEye(icon));
    const iconEye = screen.getAllByTestId("icon-eye");
    const modaleFile = document.getElementById("modaleFile")
    $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
    iconEye.forEach((icon) => {
      icon.addEventListener("click", handleClickIconEye(icon))
      userEvent.click(icon)
      expect(handleClickIconEye).toHaveBeenCalled()
    })
    expect(modaleFile).toHaveClass("show")
    })

  })})

    test("fetches bills from mock API GET", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const bill = new billsClick({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      // const getBill = jest.fn(() => bill.getBills())
      // document.body.innerHTML = BillsUI({ data: { bills }  })
      const root = document.createElement('div')
      document.body.innerHTML = "";
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const getSpy = jest.spyOn(bill, "getBills")
       const bills = await bill.getBills()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.length).toBe(4)
    })
describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    Object.defineProperty(
        window,
        "localStorage",
        { value: localStorageMock }
    )
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee",
      email: "a@a"
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
  })
  // Vérifie si l'erreur 404 s'affiche bien
  test("Then fetches bills from an API and fails with 404 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 404"))
        }
      }})
    const html = BillsUI({ error: "Erreur 404" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
// Vérifie si l'erreur 500 s'affiche bien
  test("Then fetches messages from an API and fails with 500 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 500"))
        }
      }})
    const html = BillsUI({ error: "Erreur 500" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})