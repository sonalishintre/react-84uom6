import "./style.css";
import React, { Component, useState } from "react";
import { render } from "react-dom";

import { observable, action, computed } from "mobx";
import { observer } from "mobx-react";

import { Grommet } from 'grommet';

// Stores are where the business logic resides
class UserStore {
  BASE_URL = "https://94f0b0d0.ngrok.io"

  @observable users = [];
  @observable filterType = "all";
  @observable editingUser = { id: null, FirstName: "", LastName: "", email: "", role: ""};
  @observable fetchState = "idle"


  // compute a filtered list of users
  @computed
  get filtered() {
    if (this.filterType === "all") {
      return this.users;
    } else if (this.filterType === "Active") {
      return this.users.filter(t => t.actived);
    } else {
      return this.users.filter(t => !t.actived);
    }
  }

  @computed
  get filterCompleted() {
    return this.users.filter(t => t.actived);
  }

  // set a filter type: "All", "Active" or "Inactive"
  @action
  setFilterType(filterType) {
    this.filterType = filterType;
  }

  @action
  setEditingUser(id) {
    let user = this.users.find(e => e.id === id);
    this.editingUser.id = id
    this.editingUser.first = user.first
    this.editingUser.last = user.last
    this.editingUser.email = user.email
    this.editingUser.role = user.role
  }

  @action
  clearForm = () => {
    this.editingUser.id = null
    this.editingUser.first = "";
    this.editingUser.last = "";
    this.editingUser.email = "";
    this.editingUser.role = "";
  }

  // create a user and post it to server
  @action
  create = () => {
    let newUser = {first: this.editingUser.first, last: this.editingUser.last, email:this.editingUser.email, role: this.editingUser.role, actived: false }
    fetch(this.BASE_URL + "/users", {
      method: 'post',
      body: JSON.stringify(newUser),
      headers:{'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(response => {
        this.fetchUsers()
        this.clearForm()
        console.log('Success:', JSON.stringify(response))
      })
    .catch(error => console.error('Error:', error));
  };

  // update a user
  @action
  update = () => {
    fetch(this.BASE_URL + "/users/" + this.editingUser.id, {
      method: 'PATCH',
      body: JSON.stringify(this.editingUser),
      headers:{'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    .then(response => {
        this.fetchUsers()
        this.clearForm()
        console.log('Success:', JSON.stringify(response))
      })
    .catch(error => console.error('Error:', error));
  };

  @action
  saveUser = editingUser => {
    if (this.editingUser.id == null) {
        this.create()
    } else {
        this.update()
    }
  }

  // toggle the completion state of a user
  @action
  toggle = id => {
    let user = this.users.find(e => e.id === id);
    if (user) {
      user.actived = !user.actived;
    }
  };

  // fetch all users from server
  @action
  fetchUsers = () => {
      this.fetchState = "pending"
        return fetch(this.BASE_URL + '/users')
                .then(response => response.json())
                .then(json => {
                  this.fetchState = "done"
                  this.users = json
                  })
                .catch(error => {
                  this.fetchState = "error"
                  console.log(error)
                  })
    }

}

@observer
class UserForm extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount(){
    this.props.userStore.fetchUsers()
  }

  onFormSubmit = event => {
    event.preventDefault();
    this.props.userStore.saveUser()
  };

  @action
  handleFirstInputChange = event => {
    this.props.userStore.editingUser.first = event.target.value;
  };
  @action
  handleLastInputChange = event => {
    this.props.userStore.editingUser.last = event.target.value;
  };
  @action
  handleEmailInputChange = event => {
    this.props.userStore.editingUser.email = event.target.value;
  };
  @action
  handleRoleInputChange = event => {
    this.props.userStore.editingUser.role = event.target.value;
  };

  render() {
    return (
      <form onSubmit={this.onFormSubmit}>
        <label>
          first:
          <input
            type="text"
            name="FirstName"
            value={this.props.userStore.editingUser.first}
            onChange={this.handleFirstInputChange}
          />
        </label>
        <br/>
        <label>
          last:
          <input
            type="text"
            name="LastName"
            value={this.props.userStore.editingUser.last}
            onChange={this.handleLastInputChange}
          />
        </label>
        <br/>
        <label>
          email:
          <input
            type="text"
            name="email"
            value={this.props.userStore.editingUser.email}
            onChange={this.handleEmailInputChange}
          />
        </label>
        <br/>
        <label>
          role:
          <select onChange={this.handleRoleInputChange} value={this.props.userStore.editingUser.role}>
            <option value="">--Please choose a role--</option>
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </label>
        <br/>
        <input type="submit" value={this.props.userStore.editingUser.id ? "update user" : "create user"} />
      </form>
    );
  }
}

const UserView = ({ onClick, FirstName, LastName, email, role, actived, onEditingUser }) => (
  <tr>
    <th>
      {FirstName}
    </th>
    <th>
      {LastName}
    </th>
    <th>
      {email}
    </th>
    <th>
      <select>
        <option >{role}</option>
      </select>
    </th>
    <th>
      <input
        type="checkbox"
        name="is_finish"
        value={actived}
        defaultChecked={actived}
        onClick={onClick}
      />
    </th>
    <th>
      <a href="#" onClick={onEditingUser}>Edit</a>
    </th>
  </tr>
);

const Link = ({ active, children, onClick }) => {
  if (active) {
    return (
      <span>
        {" | "} {children}
      </span>
    );
  }

  return (
    <a href="#" onClick={onClick}>
      {" | "}
      {children}
    </a>
  );
};

const UserFilter = observer(({ userStore }) => (
  <span>
    <b>Filter Users</b>:
    {["All", "Active", "Inactive"].map((status, i) => (
      <Link
        key={i}
        active={userStore.filterType === status}
        onClick={() => userStore.setFilterType(status)}
      >
        {status}
      </Link>
    ))}
  </span>
));

const FetchState = observer(({ userStore }) => (
  <div>
     Fetch State : {userStore.fetchState}
  </div>
));

const UserCounter = observer(({ userStore }) => (
  <span>
    {userStore.filterCompleted.length} of {userStore.users.length} complted
  </span>
));

const UserList = observer(({ userStore }) => (
  <table>
    <thead>
      <tr>
        <th>First Name</th>
        <th>Last Name</th>
        <th>Email Id</th>
        <th>Role</th>
        <th>Active</th>
      </tr>
    </thead>
    <tbody>
      {userStore.filtered.map(t => (
        <UserView
          key={t.id}
          first={t.first}
          last={t.last}
          email={t.email}
          role={t.role}
          actived={t.actived}
          onClick={() => {
            userStore.toggle(t.id);
          }}
          onEditingUser={() => {
            userStore.setEditingUser(t.id)
          }}
        />
      ))}
    </tbody>
  </table>
));

@observer
class JSONView extends Component {
  @observable showJSON = false;

  toggleShowJSON = () => {
    this.showJSON = !this.showJSON;
  };

  render() {
    return (
      <div>
        <input
          type="checkbox"
          name="showjson"
          value={this.showJSON}
          onChange={this.toggleShowJSON}
        />
        Show JSON
        {this.showJSON && <p>{JSON.stringify(this.props.store)}</p>}
      </div>
    );
  }
}

const UserApp = observer(() => {

  const userStore = new UserStore();
  document.userStore = userStore

  return (
    <div>
      <UserForm userStore={userStore} />
      <hr />
      <UserList userStore={userStore} />
      <hr />
      <FetchState userStore={userStore} />
      <UserCounter userStore={userStore} />
      <hr />
      <UserFilter userStore={userStore} />
      <JSONView store={userStore} />
    </div>)
})


render(<UserApp />, document.getElementById("app"));
